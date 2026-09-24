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
  FormControl,
  InputLabel,
  Select,
  TableSortLabel,
  MenuItem,
  Typography
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getImageUrl } from '../../imageHelper';

// Admin API uses different base URL than army_api
const API_BASE = (process.env.REACT_APP_API_BASE || "/backend/army_api.php")
  .replace('/army_api.php', '');
const API_KEY = process.env.REACT_APP_API_KEY;

async function adminApiCall(url, options = {}) {
  const fullUrl = `${API_BASE}/${url}`;
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

export default function FactionManager() {
  const [factions, setFactions] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [blocs, setBlocs] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [selectedGameSystemId, setSelectedGameSystemId] = useState('');
  const [selectedBlocId, setSelectedBlocId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState(null);
  const [imageOptions, setImageOptions] = useState([]);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol_url: '',
    bloc_id: ''
  });

  useEffect(() => {
    loadFactions();
    loadBlocs();
    loadGameSystems();
    loadImageOptions();
  }, []);

  useEffect(() => () => {
    if (imagePreviewSrc && imagePreviewSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewSrc);
    }
  }, [imagePreviewSrc]);

  const loadImageOptions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=images.list');
      setImageOptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading image options:', error);
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

      setFormData((prev) => ({ ...prev, symbol_url: response.filename || '' }));
      await loadImageOptions();
    } catch (error) {
      console.error('Error uploading faction image:', error);
      setUploadedImageName('');
      setFormData((prev) => ({ ...prev, symbol_url: '' }));
      resetImagePreview();
      alert('Fehler beim Hochladen des Bildes: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const loadFactions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=factions.list');
      console.log('Factions API Response:', data);
      if (Array.isArray(data)) {
        setFactions(data);
      } else {
        console.error('Factions API returned non-array:', data);
        setFactions([]);
      }
    } catch (error) {
      console.error('Error loading factions:', error);
      setFactions([]);
    }
  };

  const loadBlocs = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=blocs.list');
      if (Array.isArray(data)) {
        setBlocs(data);
      } else {
        setBlocs([]);
      }
    } catch (error) {
      console.error('Error loading blocs:', error);
      setBlocs([]);
    }
  };

  const loadGameSystems = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=game_systems.list');
      setGameSystems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading game systems:', error);
      setGameSystems([]);
    }
  };

  const handleOpenDialog = (faction = null) => {
    if (faction) {
      setEditingFaction(faction);
      setFormData({
        name: faction.name || '',
        description: faction.description || '',
        symbol_url: faction.symbol_url || '',
        bloc_id: faction.bloc_id || ''
      });
    } else {
      setEditingFaction(null);
      setFormData({ name: '', description: '', symbol_url: '', bloc_id: '' });
    }
    setUploadedImageName('');
    resetImagePreview();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFaction(null);
    setUploadedImageName('');
    resetImagePreview();
  };

  const handleSave = async () => {
    try {
      const action = editingFaction ? 'factions.update' : 'factions.create';
      const payload = editingFaction ? { ...formData, id: editingFaction.id } : formData;

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadFactions();
    } catch (error) {
      console.error('Error saving faction:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Faction wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=factions.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadFactions();
    } catch (error) {
      console.error('Error deleting faction:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const resolvedPreview = imagePreviewSrc || (formData.symbol_url ? getImageUrl(formData.symbol_url) : null);
  const imageLabel = uploadedImageName || formData.symbol_url || 'Kein Bild ausgewählt';
  const availableBlocs = blocs.filter((bloc) => {
    if (!selectedGameSystemId) return true;
    return String(bloc.game_system_id ?? '') === String(selectedGameSystemId);
  });

  const filteredFactions = factions.filter((faction) => {
    if (selectedGameSystemId && String(faction.game_system_id ?? '') !== String(selectedGameSystemId)) {
      return false;
    }
    if (selectedBlocId && String(faction.bloc_id ?? '') !== String(selectedBlocId)) {
      return false;
    }
    return true;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const sortedFactions = [...filteredFactions].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortBy === 'id') {
      return (((Number(a.id) || 0) - (Number(b.id) || 0)) * direction);
    }

    const left = sortBy === 'bloc_name'
      ? String(a?.bloc_name ?? blocs.find((bloc) => bloc.id === a.bloc_id)?.name ?? '').toLocaleLowerCase()
      : String(a?.[sortBy] ?? '').toLocaleLowerCase();
    const right = sortBy === 'bloc_name'
      ? String(b?.bloc_name ?? blocs.find((bloc) => bloc.id === b.bloc_id)?.name ?? '').toLocaleLowerCase()
      : String(b?.[sortBy] ?? '').toLocaleLowerCase();

    return left.localeCompare(right, 'de', { numeric: true, sensitivity: 'base' }) * direction;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">Factions ({filteredFactions.length}/{factions.length})</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="faction-game-system-filter-label">Game System</InputLabel>
            <Select
              labelId="faction-game-system-filter-label"
              value={selectedGameSystemId}
              label="Game System"
              onChange={(e) => {
                setSelectedGameSystemId(e.target.value);
                setSelectedBlocId('');
              }}
            >
              <MenuItem value="">Alle</MenuItem>
              {gameSystems.map((system) => (
                <MenuItem key={system.id} value={String(system.id)}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="faction-bloc-filter-label">Bloc</InputLabel>
            <Select
              labelId="faction-bloc-filter-label"
              value={selectedBlocId}
              label="Bloc"
              onChange={(e) => setSelectedBlocId(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              {availableBlocs.map((bloc) => (
                <MenuItem key={bloc.id} value={String(bloc.id)}>
                  {bloc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Neue Faction
          </Button>
        </Box>
      </Box>

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
              <TableCell sortDirection={sortBy === 'bloc_name' ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === 'bloc_name'}
                  direction={sortBy === 'bloc_name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('bloc_name')}
                >
                  Bloc
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'symbol_url' ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === 'symbol_url'}
                  direction={sortBy === 'symbol_url' ? sortDirection : 'asc'}
                  onClick={() => handleSort('symbol_url')}
                >
                  Symbol URL
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
            {sortedFactions.map((faction) => (
              <TableRow key={faction.id}>
                <TableCell>{faction.id}</TableCell>
                <TableCell><strong>{faction.name}</strong></TableCell>
                <TableCell>{faction.bloc_name || blocs.find(b => b.id === faction.bloc_id)?.name || '-'}</TableCell>
                <TableCell>{faction.symbol_url || '-'}</TableCell>
                <TableCell>{faction.description || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(faction)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(faction.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {sortedFactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Keine Factions fuer dieses Game System gefunden.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFaction ? 'Faction bearbeiten' : 'Neue Faction'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Bloc"
            value={formData.bloc_id}
            onChange={(e) => setFormData({ ...formData, bloc_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {blocs.map((bloc) => (
              <MenuItem key={bloc.id} value={bloc.id}>
                {bloc.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start', mb: 2 }}>
            <TextField
              fullWidth
              select
              label="Bild aus dem Verzeichnis"
              value={imageOptions.includes(formData.symbol_url) ? formData.symbol_url : ''}
              onChange={(e) => {
                setUploadedImageName('');
                resetImagePreview();
                setFormData({ ...formData, symbol_url: e.target.value });
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
              mb: 2,
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
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
          />
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

