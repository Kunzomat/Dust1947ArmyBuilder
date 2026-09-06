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
  Tabs,
  Tab,
  Chip,
  Stack
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

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UnitManager() {
  const [units, setUnits] = useState([]);
  const [factions, setFactions] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [rules, setRules] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitWeapons, setUnitWeapons] = useState([]);
  const [unitRules, setUnitRules] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    faction_id: '',
    type: '',
    level: '',
    points: 0,
    speed: 0,
    march_speed: 0,
    health: 0,
    image_url: '',
    notes: ''
  });

  useEffect(() => {
    loadUnits();
    loadFactions();
    loadUnitTypes();
    loadWeapons();
    loadRules();
  }, []);

  const loadUnits = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=units.list');
      console.log('Units API Response:', data);
      if (Array.isArray(data)) {
        setUnits(data);
      } else {
        console.error('Units API returned non-array:', data);
        setUnits([]);
      }
    } catch (error) {
      console.error('Error loading units:', error);
      setUnits([]);
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

  const loadUnitTypes = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=unit_types.list');
      if (Array.isArray(data)) {
        setUnitTypes(data);
      } else {
        setUnitTypes([]);
      }
    } catch (error) {
      console.error('Error loading unit types:', error);
      setUnitTypes([]);
    }
  };

  const loadWeapons = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=weapons.list');
      if (Array.isArray(data)) {
        setWeapons(data);
      } else {
        setWeapons([]);
      }
    } catch (error) {
      console.error('Error loading weapons:', error);
      setWeapons([]);
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

  const loadUnitRelations = async (unitId) => {
    try {
      const [weaponsData, rulesData] = await Promise.all([
        adminApiCall(`admin_api.php?action=unit_weapons.list&unit_id=${unitId}`),
        adminApiCall(`admin_api.php?action=unit_rules.list&unit_id=${unitId}`)
      ]);
      setUnitWeapons(Array.isArray(weaponsData) ? weaponsData : []);
      setUnitRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (error) {
      console.error('Error loading unit relations:', error);
      setUnitWeapons([]);
      setUnitRules([]);
    }
  };

  const handleOpenDialog = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name || '',
        faction_id: unit.faction_id || '',
        type: unit.type || '',
        level: unit.level || '',
        points: unit.points || 0,
        speed: unit.speed || 0,
        march_speed: unit.march_speed || 0,
        health: unit.health || 0,
        image_url: unit.image_url || '',
        notes: unit.notes || ''
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        faction_id: '',
        type: '',
        level: '',
        points: 0,
        speed: 0,
        march_speed: 0,
        health: 0,
        image_url: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUnit(null);
  };

  const handleSave = async () => {
    try {
      const action = editingUnit ? 'units.update' : 'units.create';
      const payload = editingUnit ? { ...formData, id: editingUnit.id } : formData;
      
      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      handleCloseDialog();
      loadUnits();
    } catch (error) {
      console.error('Error saving unit:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Unit wirklich löschen? (inkl. Waffen & Regeln)')) return;
    
    try {
      await adminApiCall(`admin_api.php?action=units.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleOpenRelationDialog = (unit) => {
    setSelectedUnit(unit);
    loadUnitRelations(unit.id);
    setRelationDialogOpen(true);
  };

  const handleAddWeapon = async (weaponId) => {
    try {
      await adminApiCall('admin_api.php?action=unit_weapons.add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          weapon_id: weaponId,
          quantity: 1
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error adding weapon:', error);
      alert('Fehler: ' + error.message);
    }
  };

  const handleRemoveWeapon = async (weaponId) => {
    try {
      await adminApiCall('admin_api.php?action=unit_weapons.remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          weapon_id: weaponId
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error removing weapon:', error);
    }
  };

  const handleAddRule = async (ruleId) => {
    try {
      await adminApiCall('admin_api.php?action=unit_rules.add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          rule_id: ruleId
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error adding rule:', error);
      alert('Fehler: ' + error.message);
    }
  };

  const handleRemoveRule = async (ruleId) => {
    try {
      await adminApiCall('admin_api.php?action=unit_rules.remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          rule_id: ruleId
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error removing rule:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Units ({units.length})</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Neue Unit
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Faction</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Punkte</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.id}</TableCell>
                <TableCell><strong>{unit.name}</strong></TableCell>
                <TableCell>{unit.faction_name}</TableCell>
                <TableCell>{unit.type || '-'}</TableCell>
                <TableCell>{unit.points}</TableCell>
                <TableCell>
                  <Typography variant="caption" component="div">
                    Lvl {unit.level || '-'} | 💚{unit.health || 0} | 🏃{unit.speed || 0} | 🚶{unit.march_speed || 0}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenRelationDialog(unit)}
                    title="Waffen & Regeln verwalten"
                  >
                    <LinkIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(unit)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(unit.id)}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUnit ? 'Unit bearbeiten' : 'Neue Unit'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Faction"
                value={formData.faction_id || ''}
                onChange={(e) => setFormData({ ...formData, faction_id: e.target.value })}
              >
                {factions.map((faction) => (
                  <MenuItem key={faction.id} value={faction.id}>
                    {faction.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Type"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="I">I - Infantry</MenuItem>
                <MenuItem value="V">V - Vehicle</MenuItem>
                <MenuItem value="A">A - Aircraft</MenuItem>
                <MenuItem value="H">H - Hero</MenuItem>
              </TextField>

              <TextField
                label="Level"
                value={formData.level || ''}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                placeholder="z.B. 1, 2, 3"
                helperText="1-4 oder Hero"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
              <TextField
                type="number"
                label="Punkte"
                value={formData.points || 0}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
              <TextField
                type="number"
                label="Health"
                value={formData.health || 0}
                onChange={(e) => setFormData({ ...formData, health: parseInt(e.target.value) || 0 })}
                helperText="Lebenspunkte"
              />
              <TextField
                type="number"
                label="Speed"
                value={formData.speed || 0}
                onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 0 })}
                helperText="Bewegung"
              />
              <TextField
                type="number"
                label="March Speed"
                value={formData.march_speed || 0}
                onChange={(e) => setFormData({ ...formData, march_speed: parseInt(e.target.value) || 0 })}
                helperText="Marsch"
              />
            </Box>

            <TextField
              fullWidth
              label="Image URL"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="z.B. SM_LT_EFI.png"
            />

            <TextField
              fullWidth
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Besondere Hinweise zur Einheit"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relations Dialog (Weapons & Rules) */}
      <Dialog
        open={relationDialogOpen}
        onClose={() => setRelationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedUnit?.name} - Waffen & Regeln
        </DialogTitle>
        <DialogContent>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="🔫 Waffen" />
            <Tab label="📜 Regeln" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Zugewiesene Waffen:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
              {unitWeapons.map((uw) => (
                <Chip
                  key={uw.weapon_id}
                  label={`${uw.weapon_name} (${uw.quantity}x)`}
                  onDelete={() => handleRemoveWeapon(uw.weapon_id)}
                  color="primary"
                />
              ))}
              {unitWeapons.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Keine Waffen zugewiesen
                </Typography>
              )}
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Verfügbare Waffen hinzufügen:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {weapons
                .filter(w => !unitWeapons.find(uw => uw.weapon_id === w.id))
                .map((weapon) => (
                  <Chip
                    key={weapon.id}
                    label={weapon.name}
                    onClick={() => handleAddWeapon(weapon.id)}
                    variant="outlined"
                  />
                ))}
            </Stack>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Zugewiesene Regeln:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
              {unitRules.map((ur) => (
                <Chip
                  key={ur.rule_id}
                  label={ur.rule_name}
                  onDelete={() => handleRemoveRule(ur.rule_id)}
                  color="secondary"
                />
              ))}
              {unitRules.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Keine Regeln zugewiesen
                </Typography>
              )}
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Verfügbare Regeln hinzufügen:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {rules
                .filter(r => !unitRules.find(ur => ur.rule_id === r.id))
                .map((rule) => (
                  <Chip
                    key={rule.id}
                    label={rule.name}
                    onClick={() => handleAddRule(rule.id)}
                    variant="outlined"
                  />
                ))}
            </Stack>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRelationDialogOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

