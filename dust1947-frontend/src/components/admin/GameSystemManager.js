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
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8000/backend/army_api.php")
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

export default function GameSystemManager() {
  const [gameSystems, setGameSystems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadGameSystems();
  }, []);

  const loadGameSystems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiCall('admin_api.php?action=game_systems.list');
      setGameSystems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading game systems:', error);
      setError(`Fehler beim Laden: ${error.message}`);
      setGameSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (system = null) => {
    if (system) {
      setEditingSystem(system);
      setFormData({
        name: system.name || '',
        description: system.description || ''
      });
    } else {
      setEditingSystem(null);
      setFormData({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSystem(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name ist erforderlich');
      return;
    }

    try {
      const action = editingSystem ? 'game_systems.update' : 'game_systems.create';
      const payload = editingSystem ? { ...formData, id: editingSystem.id } : formData;

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadGameSystems();
    } catch (error) {
      console.error('Error saving game system:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Game System wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=game_systems.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadGameSystems();
    } catch (error) {
      console.error('Error deleting game system:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Game Systems ({gameSystems.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Neues System
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
                <TableCell>Beschreibung</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gameSystems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      Keine Game Systems vorhanden. Erstelle ein neues System.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                gameSystems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell>{system.id}</TableCell>
                    <TableCell><strong>{system.name}</strong></TableCell>
                    <TableCell>{system.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(system)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(system.id)}
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
          {editingSystem ? 'Game System bearbeiten' : 'Neues Game System'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            placeholder="z.B. Dust 1947"
          />
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            placeholder="Optional: kurze Beschreibung des Systems"
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

