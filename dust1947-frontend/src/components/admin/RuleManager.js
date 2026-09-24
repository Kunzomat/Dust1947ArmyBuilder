import React, { useState, useEffect, useMemo } from 'react';
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
  Typography,
  FormControl,
  InputLabel,
  Select,
  TableSortLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

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

export default function RuleManager() {
  const [rules, setRules] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [filterGameSystemId, setFilterGameSystemId] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    short_text: '',
    full_text: '',
    game_system_id: ''
  });

  useEffect(() => {
    loadRules();
    loadGameSystems();
  }, []);

  const getSortValue = (rule, column) => {
    switch (column) {
      case 'id':
        return Number(rule.id) || 0;
      case 'name':
        return String(rule.name || '').toLowerCase();
      case 'game_system_name':
        return String(rule.game_system_name || '').toLowerCase();
      case 'short_text':
        return String(rule.short_text || '').toLowerCase();
      case 'full_text':
        return String(rule.full_text || '').toLowerCase();
      default:
        return '';
    }
  };

  const filteredAndSortedRules = useMemo(() => {
    const filtered = rules.filter((rule) => {
      if (!filterGameSystemId) return true;
      return String(rule.game_system_id || '') === String(filterGameSystemId);
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortBy);
      const bValue = getSortValue(b, sortBy);

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rules, filterGameSystemId, sortBy, sortDirection]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
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

  const loadRules = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=rules.list');
      console.log('Rules API Response:', data);
      if (Array.isArray(data)) {
        setRules(data);
      } else {
        console.error('Rules API returned non-array:', data);
        setRules([]);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      setRules([]);
    }
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name || '',
        short_text: rule.short_text || '',
        full_text: rule.full_text || '',
        game_system_id: rule.game_system_id || ''
      });
    } else {
      setEditingRule(null);
      setFormData({ name: '', short_text: '', full_text: '', game_system_id: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    try {
      const action = editingRule ? 'rules.update' : 'rules.create';
      const payload = {
        ...(editingRule ? { ...formData, id: editingRule.id } : formData),
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id, 10) : null
      };

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Regel wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=rules.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Rules ({filteredAndSortedRules.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="rules-game-system-filter-label">Game System</InputLabel>
            <Select
              labelId="rules-game-system-filter-label"
              value={filterGameSystemId}
              label="Game System"
              onChange={(e) => setFilterGameSystemId(e.target.value)}
            >
              <MenuItem value="">Alle Systeme</MenuItem>
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
          >
            Neue Regel
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortBy === 'id'} direction={sortBy === 'id' ? sortDirection : 'asc'} onClick={() => handleSort('id')}>
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortDirection : 'asc'} onClick={() => handleSort('name')}>
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'game_system_name'} direction={sortBy === 'game_system_name' ? sortDirection : 'asc'} onClick={() => handleSort('game_system_name')}>
                  Game System
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'short_text'} direction={sortBy === 'short_text' ? sortDirection : 'asc'} onClick={() => handleSort('short_text')}>
                  Kurzbeschreibung
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'full_text'} direction={sortBy === 'full_text' ? sortDirection : 'asc'} onClick={() => handleSort('full_text')}>
                  Volltext
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.id}</TableCell>
                <TableCell><strong>{rule.name}</strong></TableCell>
                <TableCell>{rule.game_system_name || 'Alle'}</TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rule.short_text || '-'}
                </TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rule.full_text || '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(rule)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(rule.id)}
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
          {editingRule ? 'Regel bearbeiten' : 'Neue Regel'}
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
            label="Game System (optional)"
            value={formData.game_system_id || ''}
            onChange={(e) => setFormData({ ...formData, game_system_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Alle Systeme</MenuItem>
            {gameSystems.map((system) => (
              <MenuItem key={system.id} value={system.id}>
                {system.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Kurzbeschreibung"
            value={formData.short_text}
            onChange={(e) => setFormData({ ...formData, short_text: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
            helperText="Kurze Zusammenfassung (wird in Übersichten angezeigt)"
          />
          <TextField
            fullWidth
            label="Vollständige Beschreibung"
            value={formData.full_text}
            onChange={(e) => setFormData({ ...formData, full_text: e.target.value })}
            multiline
            rows={6}
            helperText="Detaillierte Regelbeschreibung"
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

