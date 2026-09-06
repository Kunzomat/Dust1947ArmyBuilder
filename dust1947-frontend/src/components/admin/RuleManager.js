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

export default function RuleManager() {
  const [rules, setRules] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    short_text: '',
    full_text: ''
  });

  useEffect(() => {
    loadRules();
  }, []);

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
        full_text: rule.full_text || ''
      });
    } else {
      setEditingRule(null);
      setFormData({ name: '', short_text: '', full_text: '' });
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
      const payload = editingRule ? { ...formData, id: editingRule.id } : formData;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Rules ({rules.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Neue Regel
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Kurzbeschreibung</TableCell>
              <TableCell>Volltext</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.id}</TableCell>
                <TableCell><strong>{rule.name}</strong></TableCell>
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

