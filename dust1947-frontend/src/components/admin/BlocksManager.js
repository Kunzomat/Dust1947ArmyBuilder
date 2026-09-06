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

export default function BlocksManager() {
  const [blocks, setBlocks] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_system_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocksData, systemsData] = await Promise.all([
        adminApiCall('admin_api.php?action=blocks.list'),
        adminApiCall('admin_api.php?action=game_systems.list')
      ]);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
      setGameSystems(Array.isArray(systemsData) ? systemsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Fehler beim Laden: ${error.message}`);
      setBlocks([]);
      setGameSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (block = null) => {
    if (block) {
      setEditingBlock(block);
      setFormData({
        name: block.name,
        description: block.description || '',
        game_system_id: block.game_system_id || ''
      });
    } else {
      setEditingBlock(null);
      setFormData({ name: '', description: '', game_system_id: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBlock(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Bitte einen Namen eingeben');
      return;
    }

    try {
      const action = editingBlock ? 'blocks.update' : 'blocks.create';
      const payload = {
        ...formData,
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id) : null
      };
      if (editingBlock) {
        payload.id = editingBlock.id;
      }

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving block:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Block wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=blocks.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting block:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const getGameSystemName = (id) => {
    const system = gameSystems.find(gs => gs.id === id);
    return system ? system.name : '-';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Blocks ({blocks.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Neuer Block
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
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      Keine Blocks vorhanden. Erstelle einen neuen Block.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.id}</TableCell>
                    <TableCell><strong>{block.name}</strong></TableCell>
                    <TableCell>{getGameSystemName(block.game_system_id)}</TableCell>
                    <TableCell>{block.description ? block.description.substring(0, 60) + '...' : '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(block)}
                        title="Bearbeiten"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(block.id)}
                        title="Löschen"
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
          {editingBlock ? 'Block bearbeiten' : 'Neuer Block'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            placeholder="z.B. Warhammer 40K Blocks"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Game System</InputLabel>
            <Select
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
            rows={4}
            placeholder="Detaillierte Beschreibung des Blocks..."
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

