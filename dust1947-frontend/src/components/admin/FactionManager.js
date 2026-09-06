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
  MenuItem,
  Typography
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

// Admin API uses different base URL than army_api
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

export default function FactionManager() {
  const [factions, setFactions] = useState([]);
  const [blocs, setBlocs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol_url: '',
    bloc_id: ''
  });

  useEffect(() => {
    loadFactions();
    loadBlocs();
  }, []);

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

  const handleOpenDialog = (faction = null) => {
    if (faction) {
      setEditingFaction(faction);
      setFormData(faction);
    } else {
      setEditingFaction(null);
      setFormData({ name: '', description: '', symbol_url: '', bloc_id: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFaction(null);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Factions ({factions.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Neue Faction
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Bloc</TableCell>
              <TableCell>Symbol URL</TableCell>
              <TableCell>Beschreibung</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factions.map((faction) => (
              <TableRow key={faction.id}>
                <TableCell>{faction.id}</TableCell>
                <TableCell><strong>{faction.name}</strong></TableCell>
                <TableCell>{blocs.find(b => b.id === faction.bloc_id)?.name || '-'}</TableCell>
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
          <TextField
            fullWidth
            label="Symbol URL"
            value={formData.symbol_url}
            onChange={(e) => setFormData({ ...formData, symbol_url: e.target.value })}
            placeholder="z.B. spacemarine.png"
            sx={{ mb: 2 }}
          />
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

