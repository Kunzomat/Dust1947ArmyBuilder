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
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

// Admin API uses different base URL than army_api
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8000/backend/army_api.php")
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

export default function BlocManager() {
  const [blocs, setBlocs] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBloc, setEditingBloc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_system_id: ''
  });

  useEffect(() => {
    loadBlocs();
  }, []);

  const loadBlocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocsData, systemsData] = await Promise.all([
        adminApiCall('admin_api.php?action=blocs.list'),
        adminApiCall('admin_api.php?action=game_systems.list')
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

  const handleOpenDialog = (bloc = null) => {
    if (bloc) {
      setEditingBloc(bloc);
      setFormData({
        name: bloc.name,
        description: bloc.description || '',
        game_system_id: bloc.game_system_id || ''
      });
    } else {
      setEditingBloc(null);
      setFormData({ name: '', description: '', game_system_id: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBloc(null);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Blocs ({blocs.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Neuer Bloc
        </Button>
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
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Game System</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      Keine Blocs vorhanden. Erstelle einen neuen Bloc.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                blocs.map((bloc) => (
                  <TableRow key={bloc.id}>
                    <TableCell>{bloc.id}</TableCell>
                    <TableCell><strong>{bloc.name}</strong></TableCell>
                    <TableCell>{bloc.game_system_name || '-'}</TableCell>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
