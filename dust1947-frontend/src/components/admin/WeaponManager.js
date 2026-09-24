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
  Typography,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Stack,
  TableSortLabel,
  Tooltip
} from '@mui/material';
import { Edit, Delete, Add, Link as LinkIcon, ContentCopy } from '@mui/icons-material';

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

export default function WeaponManager() {
  const [weapons, setWeapons] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    range: '',
    disposable: false,
    game_system_id: ''
  });
  const [weaponStats, setWeaponStats] = useState({});
  const [weaponRules, setWeaponRules] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [filterGameSystemId, setFilterGameSystemId] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [weaponUnitsById, setWeaponUnitsById] = useState({});
  const [weaponUnitsLoadingById, setWeaponUnitsLoadingById] = useState({});
  const [weaponUnitsErrorById, setWeaponUnitsErrorById] = useState({});

  useEffect(() => {
    loadWeapons();
    loadRules();
    loadGameSystems();
  }, []);

  const getSortValue = (weapon, column) => {
    switch (column) {
      case 'id':
        return Number(weapon.id) || 0;
      case 'name':
        return String(weapon.name || '').toLowerCase();
      case 'game_system_name':
        return String(weapon.game_system_name || '').toLowerCase();
      case 'range':
        return String(weapon.range || '').toLowerCase();
      case 'disposable':
        return weapon.disposable === 1 || weapon.disposable === '1' || weapon.disposable === true ? 1 : 0;
      default:
        return '';
    }
  };

  const filteredAndSortedWeapons = useMemo(() => {
    const normalizedNameFilter = String(nameFilter || '').trim().toLowerCase();

    const filtered = weapons.filter((weapon) => {
      const gameSystemMatch = !filterGameSystemId || String(weapon.game_system_id || '') === String(filterGameSystemId);
      if (!gameSystemMatch) return false;

      if (!normalizedNameFilter) return true;
      return String(weapon.name || '').toLowerCase().includes(normalizedNameFilter);
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortBy);
      const bValue = getSortValue(b, sortBy);

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [weapons, filterGameSystemId, nameFilter, sortBy, sortDirection]);

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
      if (Array.isArray(data)) {
        setGameSystems(data);
      } else {
        setGameSystems([]);
      }
    } catch (error) {
      console.error('Error loading game systems:', error);
      setGameSystems([]);
    }
  };

  const loadRules = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=rules.list');
      if (Array.isArray(data)) {
        setAvailableRules(data);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const loadWeapons = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=weapons.list');
      console.log('Weapons API Response:', data);
      if (Array.isArray(data)) {
        // Log first weapon to check disposable type
        if (data.length > 0) {
          console.log('First weapon disposable value:', data[0].disposable, 'Type:', typeof data[0].disposable);
        }
        setWeapons(data);
      } else {
        console.error('Weapons API returned non-array:', data);
        setWeapons([]);
      }
    } catch (error) {
      console.error('Error loading weapons:', error);
      setWeapons([]);
    }
  };

  const handleOpenDialog = (weapon = null) => {
    if (weapon) {
      const disposableValue = Boolean(weapon.disposable === 1 || weapon.disposable === '1' || weapon.disposable === true);

      setEditingWeapon(weapon);
      setFormData({
        name: weapon.name || '',
        range: weapon.range || '',
        disposable: disposableValue,
        game_system_id: weapon.game_system_id || ''
      });
    } else {
      setEditingWeapon(null);
      setFormData({ name: '', range: '', disposable: false, game_system_id: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWeapon(null);
  };

  const handleOpenRelationDialog = async (weapon) => {
    setSelectedWeapon(weapon);
    setCurrentTab(0);

    // Load weapon stats
    try {
      const stats = await adminApiCall(`admin_api.php?action=weapon_stats.list&weapon_id=${weapon.id}`);
      const statsMap = {};
      stats.forEach(stat => {
        const key = `${stat.target_type}-${stat.target_level}`;
        statsMap[key] = { dice: stat.dice || '', damage: stat.damage || '' };
      });
      setWeaponStats(statsMap);
    } catch (error) {
      console.error('Error loading weapon stats:', error);
      setWeaponStats({});
    }

    // Load weapon rules
    try {
      const rules = await adminApiCall(`admin_api.php?action=weapon_rules.list&weapon_id=${weapon.id}`);
      setWeaponRules(rules.map(r => r.rule_id));
    } catch (error) {
      console.error('Error loading weapon rules:', error);
      setWeaponRules([]);
    }

    setRelationDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const action = editingWeapon ? 'weapons.update' : 'weapons.create';
      const disposableValue = formData.disposable ? 1 : 0;

      const payload = {
        ...formData,
        disposable: disposableValue,
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id, 10) : null
      };
      
      if (editingWeapon) {
        payload.id = editingWeapon.id;
      }

      await adminApiCall(`admin_api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });


      handleCloseDialog();
      loadWeapons();
    } catch (error) {
      console.error('Error saving weapon:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleSaveStats = async () => {
    try {
      const statsArray = [];
      const targetTypeLevels = {
        'I': [1, 2, 3, 4],          // Infantry: 1-4
        'V': [1, 2, 3, 4, 5, 6, 7], // Vehicle: 1-7
        'A': [1, 2, 3]              // Aircraft: 1-3
      };

      Object.keys(targetTypeLevels).forEach(type => {
        targetTypeLevels[type].forEach(level => {
          const key = `${type}-${level}`;
          const stat = weaponStats[key];
          if (stat && (stat.dice || stat.damage)) {
            statsArray.push({
              target_type: type,
              target_level: level,
              dice: stat.dice || '',
              damage: stat.damage || ''
            });
          }
        });
      });

      await adminApiCall('admin_api.php?action=weapon_stats.save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weapon_id: selectedWeapon.id, stats: statsArray })
      });

      alert('Stats gespeichert!');
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Fehler beim Speichern der Stats: ' + error.message);
    }
  };

  const handleAddRule = async (ruleId) => {
    try {
      const newRules = [...weaponRules, ruleId];

      await adminApiCall('admin_api.php?action=weapon_rules.save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weapon_id: selectedWeapon.id, rule_ids: newRules })
      });

      setWeaponRules(newRules);
    } catch (error) {
      console.error('Error adding rule:', error);
      alert('Fehler: ' + error.message);
    }
  };

  const handleRemoveRule = async (ruleId) => {
    try {
      const newRules = weaponRules.filter(id => id !== ruleId);

      await adminApiCall('admin_api.php?action=weapon_rules.save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weapon_id: selectedWeapon.id, rule_ids: newRules })
      });

      setWeaponRules(newRules);
    } catch (error) {
      console.error('Error removing rule:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Waffe wirklich löschen?')) return;

    try {
      await adminApiCall(`admin_api.php?action=weapons.delete&id=${id}`, {
        method: 'DELETE'
      });
      loadWeapons();
    } catch (error) {
      console.error('Error deleting weapon:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const loadWeaponAssignedUnits = async (weaponId) => {
    const key = String(weaponId);
    if (!weaponId || weaponUnitsById[key] || weaponUnitsLoadingById[key]) return;

    try {
      setWeaponUnitsLoadingById((prev) => ({ ...prev, [key]: true }));
      setWeaponUnitsErrorById((prev) => ({ ...prev, [key]: '' }));
      const rows = await adminApiCall(`admin_api.php?action=weapon_units.list&weapon_id=${weaponId}`);
      setWeaponUnitsById((prev) => ({ ...prev, [key]: Array.isArray(rows) ? rows : [] }));
    } catch (error) {
      setWeaponUnitsErrorById((prev) => ({ ...prev, [key]: error.message || 'Fehler beim Laden' }));
    } finally {
      setWeaponUnitsLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getArcLabel = (arcCodeRaw) => {
    const arcCode = String(arcCodeRaw || '').toUpperCase();
    const arcLabelMap = { L: 'Left', R: 'Right', F: 'Front', T: 'Turret', REAR: 'Rear' };
    return arcLabelMap[arcCode] || (arcCode || '-');
  };

  const renderWeaponUnitsTooltip = (weaponId) => {
    const key = String(weaponId);
    const isLoading = Boolean(weaponUnitsLoadingById[key]);
    const error = weaponUnitsErrorById[key];
    const rows = weaponUnitsById[key] || [];

    if (isLoading) {
      return <Typography variant="caption">Lade Einheiten...</Typography>;
    }

    if (error) {
      return <Typography variant="caption">Fehler: {error}</Typography>;
    }

    if (rows.length === 0) {
      return <Typography variant="caption">Diese Waffe ist keiner Einheit zugewiesen.</Typography>;
    }

    return (
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
          Zugewiesene Einheiten ({rows.length})
        </Typography>
        {rows.map((row) => {
          const amount = Math.max(1, Number(row.quantity ?? row.number ?? 1) || 1);
          const arcLabel = getArcLabel(row.firing_arc);
          const rowKey = row.unit_weapon_id || `${row.unit_id}-${row.weapon_id}-${amount}-${arcLabel}`;
          return (
            <Typography key={rowKey} variant="caption" sx={{ display: 'block', lineHeight: 1.35 }}>
              - {row.unit_name} ({amount}x, Arc: {arcLabel})
            </Typography>
          );
        })}
      </Box>
    );
  };

  const handleClone = async (weapon) => {
    if (!weapon?.id) return;

    try {
      await adminApiCall('admin_api.php?action=weapons.clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: weapon.id })
      });

      await loadWeapons();
    } catch (error) {
      console.error('Error cloning weapon:', error);
      alert('Fehler beim Klonen: ' + error.message);
    }
  };

  function TabPanel({ children, value, index }) {
    return (
      <div role="tabpanel" hidden={value !== index}>
        {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      </div>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Weapons ({filteredAndSortedWeapons.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Waffe suchen"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Contains (ab 1 Zeichen)"
            sx={{ minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="weapons-game-system-filter-label">Game System</InputLabel>
            <Select
              labelId="weapons-game-system-filter-label"
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
            Neue Waffe
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
                <TableSortLabel active={sortBy === 'range'} direction={sortBy === 'range' ? sortDirection : 'asc'} onClick={() => handleSort('range')}>
                  Reichweite
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'disposable'} direction={sortBy === 'disposable' ? sortDirection : 'asc'} onClick={() => handleSort('disposable')}>
                  Einmalwaffe
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedWeapons.map((weapon) => {
              const isDisposable = weapon.disposable === 1 || weapon.disposable === '1' || weapon.disposable === true;
              return (
                <TableRow key={weapon.id}>
                  <TableCell>{weapon.id}</TableCell>
                  <TableCell>
                    <Tooltip title={renderWeaponUnitsTooltip(weapon.id)} placement="top-start" arrow>
                      <Box
                        component="span"
                        onMouseEnter={() => loadWeaponAssignedUnits(weapon.id)}
                        sx={{ cursor: 'help', display: 'inline-block' }}
                      >
                        <strong>{weapon.name}</strong>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{weapon.game_system_name || 'Alle'}</TableCell>
                  <TableCell>{weapon.range || '-'}</TableCell>
                  <TableCell>
                    {isDisposable ? (
                      <Chip label="Ja" color="warning" size="small" />
                    ) : (
                      <Chip label="Nein" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenRelationDialog(weapon)}
                      title="Stats & Regeln verwalten"
                    >
                      <LinkIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(weapon)}
                      title="Waffe bearbeiten"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleClone(weapon)}
                      title="Waffe klonen"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(weapon.id)}
                      title="Waffe löschen"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog - NUR Basis-Felder */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWeapon ? 'Waffe bearbeiten' : 'Neue Waffe'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="z.B. 'Laser Grenade Launcher', 'Panzerfaust'"
            />

            <TextField
              fullWidth
              select
              label="Game System (optional)"
              value={formData.game_system_id || ''}
              onChange={(e) => setFormData({ ...formData, game_system_id: e.target.value })}
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
              label="Reichweite"
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              helperText="z.B. '0-24', '12-48', '0-6'"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.disposable}
                  onChange={(e) => setFormData({ ...formData, disposable: e.target.checked })}
                />
              }
              label="Einmalwaffe (nach Benutzung verbraucht)"
            />

            {editingWeapon && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                💡 Tipp: Stats & Regeln können über das 🔗-Icon in der Tabelle verwaltet werden
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relations Dialog (Stats & Rules) */}
      <Dialog
        open={relationDialogOpen}
        onClose={() => setRelationDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedWeapon?.name} - Stats & Regeln
        </DialogTitle>
        <DialogContent>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="🎯 Stats" />
            <Tab label="📜 Regeln" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Weapon Stats (Nur nicht-leere Werte werden gespeichert)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Target Type</TableCell>
                      <TableCell>Level 1</TableCell>
                      <TableCell>Level 2</TableCell>
                      <TableCell>Level 3</TableCell>
                      <TableCell>Level 4</TableCell>
                      <TableCell>Level 5</TableCell>
                      <TableCell>Level 6</TableCell>
                      <TableCell>Level 7</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { type: 'I', label: 'Infantry', levels: [1, 2, 3, 4] },
                      { type: 'V', label: 'Vehicle', levels: [1, 2, 3, 4, 5, 6, 7] },
                      { type: 'A', label: 'Aircraft', levels: [1, 2, 3] }
                    ].map(({ type: targetType, label, levels }) => (
                      <TableRow key={targetType}>
                        <TableCell>
                          <strong>{targetType}</strong>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {label}
                          </Typography>
                        </TableCell>
                        {[1, 2, 3, 4, 5, 6, 7].map(level => {
                          const isActive = levels.includes(level);
                          if (!isActive) {
                            return <TableCell key={level} sx={{ bgcolor: 'grey.100' }} />;
                          }
                          const key = `${targetType}-${level}`;
                          const stat = weaponStats[key] || { dice: '', damage: '' };
                          return (
                            <TableCell key={level}>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <TextField
                                  size="small"
                                  placeholder="D"
                                  value={stat.dice}
                                  onChange={(e) => setWeaponStats({
                                    ...weaponStats,
                                    [key]: { ...stat, dice: e.target.value }
                                  })}
                                  sx={{ width: 50 }}
                                  inputProps={{ style: { textAlign: 'center' } }}
                                />
                                <Typography variant="caption">/</Typography>
                                <TextField
                                  size="small"
                                  placeholder="DMG"
                                  value={stat.damage}
                                  onChange={(e) => setWeaponStats({
                                    ...weaponStats,
                                    [key]: { ...stat, damage: e.target.value }
                                  })}
                                  sx={{ width: 50 }}
                                  inputProps={{ style: { textAlign: 'center' } }}
                                />
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Format: Dice / Damage (z.B. "3" / "2" für 3 Würfel mit 2 Schaden)
              </Typography>
              <Button
                variant="contained"
                onClick={handleSaveStats}
                sx={{ mt: 2 }}
              >
                Stats speichern
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Zugewiesene Regeln:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
              {weaponRules.map((ruleId) => {
                const rule = availableRules.find(r => r.id === ruleId);
                return (
                  <Chip
                    key={ruleId}
                    label={rule?.name || ruleId}
                    onDelete={() => handleRemoveRule(ruleId)}
                    color="secondary"
                  />
                );
              })}
              {weaponRules.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Keine Regeln zugewiesen
                </Typography>
              )}
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Verfügbare Regeln hinzufügen:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {availableRules
                .filter(r => !weaponRules.includes(r.id))
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

