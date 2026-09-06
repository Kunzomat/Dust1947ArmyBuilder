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
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { Edit, Delete, Add, Link as LinkIcon } from '@mui/icons-material';

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

export default function PlatoonManager() {
  const [platoons, setPlatoons] = useState([]);
  const [factions, setFactions] = useState([]);
  const [rules, setRules] = useState([]);
  const [units, setUnits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlatoon, setEditingPlatoon] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    faction_id: '',
    rule_id: null
  });

  // Slot management
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [selectedPlatoon, setSelectedPlatoon] = useState(null);
  const [platoonSlots, setPlatoonSlots] = useState([]);
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotFormData, setSlotFormData] = useState({
    slot: '',
    unit_id: ''
  });

  useEffect(() => {
    loadPlatoons();
    loadFactions();
    loadRules();
    loadUnits();
  }, []);

  const loadPlatoons = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=platoons.list');
      console.log('Platoons API Response:', data);
      if (Array.isArray(data)) {
        setPlatoons(data);
      } else {
        console.error('Platoons API returned non-array:', data);
        setPlatoons([]);
      }
    } catch (error) {
      console.error('Error loading platoons:', error);
      setPlatoons([]);
    }
  };

  const loadFactions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=factions.list');
      if (Array.isArray(data)) {
        setFactions(data);
      } else {
        setFactions([]);
      }
    } catch (error) {
      console.error('Error loading factions:', error);
      setFactions([]);
    }
  };

  const loadRules = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=rules.list');
      if (Array.isArray(data)) {
        setRules(data);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      setRules([]);
    }
  };

  const loadUnits = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=units.list');
      if (Array.isArray(data)) {
        setUnits(data);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error('Error loading units:', error);
      setUnits([]);
    }
  };

  const handleOpenDialog = (platoon = null) => {
    if (platoon) {
      setEditingPlatoon(platoon);
      setFormData({
        name: platoon.name,
        faction_id: platoon.faction_id,
        rule_id: platoon.rule_id || null
      });
    } else {
      setEditingPlatoon(null);
      setFormData({ name: '', faction_id: '', rule_id: null });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlatoon(null);
  };

  const handleSave = async () => {
    try {
      const action = editingPlatoon ? 'platoons.update' : 'platoons.create';
      const payload = editingPlatoon ? { ...formData, id: editingPlatoon.id } : formData;

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      handleCloseDialog();
      loadPlatoons();
    } catch (error) {
      console.error('Error saving platoon:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Platoon wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=platoons.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadPlatoons();
    } catch (error) {
      console.error('Error deleting platoon:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  // Slot Management
  const handleOpenSlotDialog = async (platoon) => {
    setSelectedPlatoon(platoon);
    setSlotDialogOpen(true);
    await loadPlatoonSlots(platoon.id);
  };

  const loadPlatoonSlots = async (platoonId) => {
    try {
      const data = await adminApiCall(`admin_api.php?action=platoon_units.list&platoon_id=${platoonId}`);
      if (Array.isArray(data)) {
        setPlatoonSlots(data);
      } else {
        setPlatoonSlots([]);
      }
    } catch (error) {
      console.error('Error loading platoon slots:', error);
      setPlatoonSlots([]);
    }
  };

  const handleOpenSlotForm = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotFormData({
        slot: slot.slot,
        unit_id: slot.unit_id
      });
    } else {
      setEditingSlot(null);
      setSlotFormData({
        slot: '',
        unit_id: ''
      });
    }
    setSlotFormOpen(true);
  };

  const handleSaveSlot = async () => {
    try {
      if (editingSlot) {
        // Update
        await adminApiCall('admin_api.php?action=platoon_units.update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSlot.id,
            ...slotFormData
          })
        });
      } else {
        // Create
        await adminApiCall('admin_api.php?action=platoon_units.add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platoon_id: selectedPlatoon.id,
            ...slotFormData
          })
        });
      }
      setSlotFormOpen(false);
      loadPlatoonSlots(selectedPlatoon.id);
    } catch (error) {
      console.error('Error saving slot:', error);
      alert('Fehler: ' + error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Slot wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=platoon_units.delete&id=${slotId}`, {
        method: 'DELETE'
      });
      loadPlatoonSlots(selectedPlatoon.id);
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Fehler: ' + error.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Platoons ({platoons.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Neues Platoon
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Fraktion</TableCell>
              <TableCell>Regel</TableCell>
              <TableCell>Slots</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {platoons.map((platoon) => (
              <TableRow key={platoon.id}>
                <TableCell>{platoon.id}</TableCell>
                <TableCell><strong>{platoon.name}</strong></TableCell>
                <TableCell>{platoon.faction_name}</TableCell>
                <TableCell>{platoon.rule_name || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={`${platoon.slot_count || 0} Slots`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenSlotDialog(platoon)}
                    title="Slots verwalten"
                  >
                    <LinkIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(platoon)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(platoon.id)}
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
          {editingPlatoon ? 'Platoon bearbeiten' : 'Neues Platoon'}
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
            label="Fraktion"
            value={formData.faction_id}
            onChange={(e) => setFormData({ ...formData, faction_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {factions.map((faction) => (
              <MenuItem key={faction.id} value={faction.id}>
                {faction.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Regel (optional)"
            value={formData.rule_id || ''}
            onChange={(e) => setFormData({ ...formData, rule_id: e.target.value || null })}
          >
            <MenuItem value="">Keine Regel</MenuItem>
            {rules.map((rule) => (
              <MenuItem key={rule.id} value={rule.id}>
                {rule.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Slot Management Dialog */}
      <Dialog
        open={slotDialogOpen}
        onClose={() => setSlotDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPlatoon?.name} - Slots verwalten
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenSlotForm()}
              size="small"
            >
              Neuer Slot
            </Button>
          </Box>

          <List>
            {platoonSlots.map((slot, index) => (
              <React.Fragment key={slot.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSlotForm(slot)}
                        title="Bearbeiten"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSlot(slot.id)}
                        title="Löschen"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={slot.slot} size="small" color="primary" />
                        <Typography>{slot.unit_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({slot.unit_points} Pkt)
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
            {platoonSlots.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Keine Slots definiert
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Slot Form Dialog */}
      <Dialog
        open={slotFormOpen}
        onClose={() => setSlotFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSlot ? 'Slot bearbeiten' : 'Neuer Slot'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Slot-Name"
              value={slotFormData.slot}
              onChange={(e) => setSlotFormData({ ...slotFormData, slot: e.target.value })}
              helperText="Typ des Slots im Platoon"
            >
              <MenuItem value="Command">Command</MenuItem>
              <MenuItem value="Combat 1">Combat 1</MenuItem>
              <MenuItem value="Combat 2">Combat 2</MenuItem>
              <MenuItem value="Combat 3">Combat 3</MenuItem>
              <MenuItem value="Combat 4">Combat 4</MenuItem>
              <MenuItem value="Combat 5">Combat 5</MenuItem>
              <MenuItem value="Combat 6">Combat 6</MenuItem>
            </TextField>
            <TextField
              fullWidth
              select
              label="Unit"
              value={slotFormData.unit_id}
              onChange={(e) => setSlotFormData({ ...slotFormData, unit_id: e.target.value })}
            >
              {units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.faction_name}) - {unit.points} Pkt
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotFormOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveSlot} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

