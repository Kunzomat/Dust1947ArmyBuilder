import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableSortLabel,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getImageUrl } from '../../imageHelper';

// Admin API uses different base URL than army_api
const API_BASE = (process.env.REACT_APP_API_BASE || "/backend/army_api.php")
  .replace('/army_api.php', ''); // Remove army_api.php to get base path
const API_KEY = process.env.REACT_APP_API_KEY;

async function adminApiCall(url, options = {}) {
  const fullUrl = `${API_BASE}/${url}`;
  console.log('Admin API Call:', fullUrl); // 🔍 Debug URL
  const headers = {
    'X-API-Key': API_KEY || '',
    ...options.headers
  };
  
  const response = await fetch(fullUrl, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Bild konnte nicht verarbeitet werden.'));
    image.src = src;
  });

async function optimizeImageForUpload(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const mimeType = file.type || 'image/png';

  if (mimeType === 'image/svg+xml') {
    return originalDataUrl;
  }

  const image = await loadImageElement(originalDataUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);

  const exportType = ['image/jpeg', 'image/webp', 'image/png'].includes(mimeType)
    ? mimeType
    : 'image/jpeg';

  return canvas.toDataURL(exportType, 0.85);
}

export default function BlocManager() {
  const [blocs, setBlocs] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [gameSystems, setGameSystems] = useState([]);
  const [selectedGameSystemId, setSelectedGameSystemId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBloc, setEditingBloc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageOptions, setImageOptions] = useState([]);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    game_system_id: ''
  });

  useEffect(() => {
    loadBlocs();
  }, []);

  useEffect(() => () => {
    if (imagePreviewSrc && imagePreviewSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewSrc);
    }
  }, [imagePreviewSrc]);

  const loadBlocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocsData, systemsData] = await Promise.all([
        adminApiCall('admin_api.php?action=blocs.list'),
        adminApiCall('admin_api.php?action=game_systems.list'),
        loadImageOptions()
      ]);
      console.log('Blocs API Response:', blocsData);
      // Ensure blocsData is always an array
      if (Array.isArray(blocsData)) {
        setBlocs(blocsData);
      } else {
        console.error('Blocs API returned non-array:', blocsData);
        setBlocs([]);
        setError('API returned unexpected format');
      }
      setGameSystems(Array.isArray(systemsData) ? systemsData : []);
    } catch (error) {
      console.error('Error loading blocs:', error);
      setError(`Fehler beim Laden: ${error.message}`);
      setBlocs([]); // Keep as empty array on error
      setGameSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadImageOptions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=images.list');
      setImageOptions(Array.isArray(data) ? data : []);
    } catch (imageError) {
      console.error('Error loading image options:', imageError);
      setImageOptions([]);
    }
  };

  const resetImagePreview = () => {
    setImagePreviewSrc((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return '';
    });
  };

  const handleImageFile = async (file) => {
    if (!file) return;

    resetImagePreview();
    setImagePreviewSrc(URL.createObjectURL(file));
    setUploadedImageName(file.name || 'Hochgeladenes Bild');

    try {
      setIsUploadingImage(true);
      const optimizedImageData = await optimizeImageForUpload(file);
      const response = await adminApiCall('admin_api.php?action=images.upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: optimizedImageData,
          originalName: file.name || 'image.png',
        }),
      });

      setFormData((prev) => ({ ...prev, image_url: response.filename || '' }));
      await loadImageOptions();
    } catch (uploadError) {
      console.error('Error uploading bloc image:', uploadError);
      setUploadedImageName('');
      setFormData((prev) => ({ ...prev, image_url: '' }));
      resetImagePreview();
      alert('Fehler beim Hochladen des Bildes: ' + uploadError.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenDialog = (bloc = null) => {
    if (bloc) {
      setEditingBloc(bloc);
      setFormData({
        name: bloc.name,
        description: bloc.description || '',
        image_url: bloc.image_url || '',
        game_system_id: bloc.game_system_id || ''
      });
    } else {
      setEditingBloc(null);
      setFormData({ name: '', description: '', image_url: '', game_system_id: '' });
    }
    setUploadedImageName('');
    resetImagePreview();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBloc(null);
    setUploadedImageName('');
    resetImagePreview();
  };

  const handleSave = async () => {
    try {
      const action = editingBloc ? 'blocs.update' : 'blocs.create';
      const payload = {
        ...formData,
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id) : null
      };
      if (editingBloc) {
        payload.id = editingBloc.id;
      }

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadBlocs();
    } catch (error) {
      console.error('Error saving bloc:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bloc wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=blocs.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadBlocs();
    } catch (error) {
      console.error('Error deleting bloc:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const filteredBlocs = blocs.filter((bloc) => {
    if (!selectedGameSystemId) return true;
    return String(bloc.game_system_id ?? '') === String(selectedGameSystemId);
  });

  const sortedBlocs = [...filteredBlocs].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortBy === 'id') {
      return (((Number(a.id) || 0) - (Number(b.id) || 0)) * direction);
    }
    const left = String(a?.[sortBy] ?? '').toLocaleLowerCase();
    const right = String(b?.[sortBy] ?? '').toLocaleLowerCase();
    return left.localeCompare(right, 'de', { numeric: true, sensitivity: 'base' }) * direction;
  });

  const resolvedPreview = imagePreviewSrc || (formData.image_url ? getImageUrl(formData.image_url) : null);
  const imageLabel = uploadedImageName || formData.image_url || 'Kein Bild ausgewählt';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">Blocs ({filteredBlocs.length}/{blocs.length})</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="bloc-game-system-filter-label">Game System</InputLabel>
            <Select
              labelId="bloc-game-system-filter-label"
              value={selectedGameSystemId}
              label="Game System"
              onChange={(e) => setSelectedGameSystemId(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              {gameSystems.map((system) => (
                <MenuItem key={system.id} value={String(system.id)}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Neuer Bloc
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortBy === 'id' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortBy === 'id'}
                    direction={sortBy === 'id' ? sortDirection : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'name' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'game_system_name' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortBy === 'game_system_name'}
                    direction={sortBy === 'game_system_name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('game_system_name')}
                  >
                    Game System
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'image_url' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortBy === 'image_url'}
                    direction={sortBy === 'image_url' ? sortDirection : 'asc'}
                    onClick={() => handleSort('image_url')}
                  >
                    Bild
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'description' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortBy === 'description'}
                    direction={sortBy === 'description' ? sortDirection : 'asc'}
                    onClick={() => handleSort('description')}
                  >
                    Beschreibung
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBlocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      Keine Blocs vorhanden. Erstelle einen neuen Bloc.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedBlocs.map((bloc) => (
                  <TableRow key={bloc.id}>
                    <TableCell>{bloc.id}</TableCell>
                    <TableCell><strong>{bloc.name}</strong></TableCell>
                    <TableCell>{bloc.game_system_name || '-'}</TableCell>
                    <TableCell>{bloc.image_url || '-'}</TableCell>
                    <TableCell>{bloc.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(bloc)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(bloc.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBloc ? 'Bloc bearbeiten' : 'Neuer Bloc'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Game System</InputLabel>
            <Select
              variant="outlined"
              value={formData.game_system_id}
              label="Game System"
              onChange={(e) => setFormData({ ...formData, game_system_id: e.target.value })}
            >
              <MenuItem value="">Kein System</MenuItem>
              {gameSystems.map((system) => (
                <MenuItem key={system.id} value={system.id}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start', mb: 2 }}>
            <TextField
              fullWidth
              select
              label="Bild aus dem Verzeichnis"
              value={imageOptions.includes(formData.image_url) ? formData.image_url : ''}
              onChange={(e) => {
                setUploadedImageName('');
                resetImagePreview();
                setFormData({ ...formData, image_url: e.target.value });
              }}
              helperText="Ein vorhandenes Bild aus `backend/images` auswählen"
            >
              <MenuItem value="">Keins auswählen</MenuItem>
              {imageOptions.map((image) => (
                <MenuItem key={image} value={image}>
                  {image}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="outlined" component="label" sx={{ height: 56, alignSelf: 'center' }} disabled={isUploadingImage}>
              {isUploadingImage ? 'Bild wird hochgeladen…' : 'Bild hochladen'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </Button>
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              minHeight: 128,
            }}
          >
            {resolvedPreview ? (
              <Box
                component="img"
                src={resolvedPreview}
                alt="Vorschau"
                sx={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            ) : (
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  border: '1px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  fontSize: 12,
                  textAlign: 'center',
                  px: 1,
                }}
              >
                Keine Vorschau
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Aktuelles Bild</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {imageLabel}
              </Typography>
            </Box>
          </Box>
          {isUploadingImage && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Bild wird gerade hochgeladen. Bitte kurz warten, bevor du speicherst.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={isUploadingImage}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
