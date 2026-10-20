import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ADMIN_CLONE_BUTTON_COLOR } from './adminStyles';
import useSessionStorageState from '../../hooks/useSessionStorageState';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const WEAPON_TARGET_TYPE_LEVELS = {
  I: [1, 2, 3, 4],
  V: [1, 2, 3, 4, 5, 6, 7],
  A: [1, 2, 3]
};

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
  const [cloneSourceWeapon, setCloneSourceWeapon] = useState(null);
  const [cloneTab, setCloneTab] = useState(0);
  const [cloneWeaponStats, setCloneWeaponStats] = useState({});
  const [cloneWeaponRules, setCloneWeaponRules] = useState([]);
  const [cloneRelationsReady, setCloneRelationsReady] = useState(false);
  const cloneRelationsLoadToken = useRef(0);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    range: '',
    disposable: false,
    game_system_id: '',
    faction_id: ''
  });
  const [weaponStats, setWeaponStats] = useState({});
  const [weaponRules, setWeaponRules] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [factions, setFactions] = useState([]);
  const [filters, setFilters] = useSessionStorageState(
    'dust1947.filters.v1.admin.weapons',
    { filterGameSystemId: '', filterFactionId: '', nameFilter: '' }
  );
  const { filterGameSystemId, filterFactionId, nameFilter } = filters;
  const setFilter = (field, value) =>
    setFilters((previous) => ({ ...previous, [field]: value }));
  const setFilterGameSystemId = (value) => setFilter('filterGameSystemId', value);
  const setFilterFactionId = (value) => setFilter('filterFactionId', value);
  const setNameFilter = (value) => setFilter('nameFilter', value);
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [weaponUnitsById, setWeaponUnitsById] = useState({});
  const [weaponUnitsLoadingById, setWeaponUnitsLoadingById] = useState({});
  const [weaponUnitsErrorById, setWeaponUnitsErrorById] = useState({});

  useEffect(() => {
    loadWeapons();
    loadRules();
    loadGameSystems();
    loadFactions();
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

      const factionMatch = !filterFactionId || String(weapon.faction_id || '') === String(filterFactionId);
      if (!factionMatch) return false;

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
  }, [weapons, filterGameSystemId, filterFactionId, nameFilter, sortBy, sortDirection]);

  const availableFactionsForFilter = useMemo(() => {
    if (!filterGameSystemId) {
      return factions;
    }

    return factions.filter(
      (faction) => String(faction.game_system_id || '') === String(filterGameSystemId)
    );
  }, [factions, filterGameSystemId]);

  useEffect(() => {
    if (filterGameSystemId && gameSystems.length > 0
      && !gameSystems.some((system) => String(system.id) === String(filterGameSystemId))) {
      setFilters((previous) => ({ ...previous, filterGameSystemId: '' }));
    }
    if (filterFactionId && factions.length > 0
      && !availableFactionsForFilter.some((faction) => String(faction.id) === String(filterFactionId))) {
      setFilters((previous) => ({ ...previous, filterFactionId: '' }));
    }
  }, [availableFactionsForFilter, factions.length, filterFactionId, filterGameSystemId, gameSystems, setFilters]);

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

  const loadFactions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=factions.list');
      setFactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading factions:', error);
      setFactions([]);
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

  const availableFactionsForForm = useMemo(() => {
    if (!formData.game_system_id) {
      return factions;
    }

    return factions.filter(
      (faction) => String(faction.game_system_id || '') === String(formData.game_system_id)
    );
  }, [factions, formData.game_system_id]);

  const handleOpenDialog = (weapon = null, options = {}) => {
    const { clone = false } = options;

    if (weapon) {
      const disposableValue = Boolean(weapon.disposable === 1 || weapon.disposable === '1' || weapon.disposable === true);

      setEditingWeapon(clone ? null : weapon);
      setCloneSourceWeapon(clone ? weapon : null);
      setFormData({
        name: clone ? `${weapon.name} (Kopie)` : (weapon.name || ''),
        range: weapon.range || '',
        disposable: disposableValue,
        game_system_id: weapon.game_system_id || '',
        faction_id: weapon.faction_id || ''
      });

      if (clone) {
        setCloneTab(0);
        setCloneWeaponStats({});
        setCloneWeaponRules([]);
        setCloneRelationsReady(false);
        const loadToken = ++cloneRelationsLoadToken.current;
        // Opening the clone dialog is read-only. The POST that creates the
        // weapon is deliberately deferred until the user saves the draft.
        Promise.all([
          adminApiCall(`admin_api.php?action=weapon_stats.list&weapon_id=${weapon.id}`),
          adminApiCall(`admin_api.php?action=weapon_rules.list&weapon_id=${weapon.id}`)
        ]).then(([stats, rules]) => {
          if (loadToken !== cloneRelationsLoadToken.current) return;
          const statsMap = {};
          (Array.isArray(stats) ? stats : []).forEach((stat) => {
            statsMap[`${stat.target_type}-${stat.target_level}`] = {
              dice: stat.dice ?? '',
              damage: stat.damage ?? ''
            };
          });
          setCloneWeaponStats(statsMap);
          setCloneWeaponRules(
            (Array.isArray(rules) ? rules : []).map((rule) => Number(rule.rule_id))
          );
          setCloneRelationsReady(true);
        }).catch((error) => {
          if (loadToken !== cloneRelationsLoadToken.current) return;
          console.error('Error loading clone weapon relations:', error);
          alert('Stats oder Regeln der Quellwaffe konnten nicht geladen werden: ' + error.message);
        });
      }
    } else {
      setEditingWeapon(null);
      setCloneSourceWeapon(null);
      setFormData({ name: '', range: '', disposable: false, game_system_id: '', faction_id: '' });
      setCloneWeaponStats({});
      setCloneWeaponRules([]);
      setCloneRelationsReady(false);
      cloneRelationsLoadToken.current += 1;
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWeapon(null);
    setCloneSourceWeapon(null);
    setCloneWeaponStats({});
    setCloneWeaponRules([]);
    setCloneRelationsReady(false);
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
      const isClone = !editingWeapon && Boolean(cloneSourceWeapon?.id);
      const action = editingWeapon ? 'weapons.update' : (isClone ? 'weapons.clone' : 'weapons.create');
      const disposableValue = formData.disposable ? 1 : 0;

      const payload = {
        ...formData,
        disposable: disposableValue,
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id, 10) : null,
        faction_id: formData.faction_id ? parseInt(formData.faction_id, 10) : null
      };
      
      if (editingWeapon) {
        payload.id = editingWeapon.id;
      } else if (isClone) {
        payload.id = cloneSourceWeapon.id;
        payload.stats = Object.entries(cloneWeaponStats)
          .map(([key, stat]) => {
            const [target_type, target_level] = key.split('-');
            return {
              target_type,
              target_level: Number(target_level),
              dice: stat.dice,
              damage: stat.damage
            };
          })
          .filter((stat) => stat.dice !== '' || stat.damage !== '');
        payload.rule_ids = cloneWeaponRules;
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
      Object.keys(WEAPON_TARGET_TYPE_LEVELS).forEach(type => {
        WEAPON_TARGET_TYPE_LEVELS[type].forEach(level => {
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
              onChange={(e) => {
                setFilterGameSystemId(e.target.value);
                setFilterFactionId('');
              }}
            >
              <MenuItem value="">Alle Systeme</MenuItem>
              {gameSystems.map((system) => (
                <MenuItem key={system.id} value={String(system.id)}>
                  {system.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="weapons-faction-filter-label">Faction</InputLabel>
            <Select
              labelId="weapons-faction-filter-label"
              value={filterFactionId}
              label="Faction"
              onChange={(e) => setFilterFactionId(e.target.value)}
            >
              <MenuItem value="">Alle Fraktionen</MenuItem>
              {availableFactionsForFilter.map((faction) => (
                <MenuItem key={faction.id} value={String(faction.id)}>
                  {faction.name}
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
                      color={ADMIN_CLONE_BUTTON_COLOR}
                      onClick={() => handleOpenDialog(weapon, { clone: true })}
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

      {/* Create/Edit dialog; clones additionally carry an editable relations draft. */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth={cloneSourceWeapon ? 'lg' : 'sm'} fullWidth>
        <DialogTitle>
          {editingWeapon ? 'Waffe bearbeiten' : (cloneSourceWeapon ? 'Waffe klonen' : 'Neue Waffe')}
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
              onChange={(e) => setFormData({ ...formData, game_system_id: e.target.value, faction_id: '' })}
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
              select
              label="Faction (optional)"
              value={formData.faction_id || ''}
              disabled={Boolean(formData.game_system_id) && availableFactionsForForm.length === 0}
              onChange={(e) => setFormData({ ...formData, faction_id: e.target.value })}
            >
              <MenuItem value="">Alle Fraktionen</MenuItem>
              {availableFactionsForForm.length === 0 && formData.game_system_id && (
                <MenuItem value="" disabled>
                  Keine Fraktionen für dieses Game System
                </MenuItem>
              )}
              {availableFactionsForForm.map((faction) => (
                <MenuItem key={faction.id} value={faction.id}>
                  {faction.name}
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

            {cloneSourceWeapon && (
              <>
                {!cloneRelationsReady && (
                  <Typography variant="body2" color="text.secondary">
                    Stats und Regeln der Quellwaffe werden geladen…
                  </Typography>
                )}
                <Tabs value={cloneTab} onChange={(e, value) => setCloneTab(value)} sx={{ mt: 1 }}>
                  <Tab label="🎯 Stats" />
                  <Tab label="📜 Regeln" />
                </Tabs>

                <TabPanel value={cloneTab} index={0}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Weapon Stats (Nur nicht-leere Werte werden gespeichert)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Target Type</TableCell>
                          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                            <TableCell key={level}>Level {level}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { type: 'I', label: 'Infantry' },
                          { type: 'V', label: 'Vehicle' },
                          { type: 'A', label: 'Aircraft' }
                        ].map(({ type: targetType, label }) => (
                          <TableRow key={targetType}>
                            <TableCell>
                              <strong>{targetType}</strong>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {label}
                              </Typography>
                            </TableCell>
                            {[1, 2, 3, 4, 5, 6, 7].map((level) => {
                              if (!WEAPON_TARGET_TYPE_LEVELS[targetType].includes(level)) {
                                return <TableCell key={level} sx={{ bgcolor: 'grey.100' }} />;
                              }
                              const key = `${targetType}-${level}`;
                              const stat = cloneWeaponStats[key] || { dice: '', damage: '' };
                              return (
                                <TableCell key={level}>
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <TextField
                                      size="small"
                                      placeholder="D"
                                      value={stat.dice}
                                      onChange={(e) => setCloneWeaponStats({
                                        ...cloneWeaponStats,
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
                                      onChange={(e) => setCloneWeaponStats({
                                        ...cloneWeaponStats,
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
                    Format: Dice / Damage (z.B. &quot;3&quot; / &quot;2&quot; für 3 Würfel mit 2 Schaden)
                  </Typography>
                </TabPanel>

                <TabPanel value={cloneTab} index={1}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Zugewiesene Regeln:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                    {cloneWeaponRules.map((ruleId) => {
                      const rule = availableRules.find((item) => Number(item.id) === Number(ruleId));
                      return (
                        <Chip
                          key={ruleId}
                          label={rule?.name || ruleId}
                          onDelete={() => setCloneWeaponRules(cloneWeaponRules.filter((id) => id !== ruleId))}
                          color="secondary"
                        />
                      );
                    })}
                    {cloneWeaponRules.length === 0 && (
                      <Typography variant="body2" color="text.secondary">Keine Regeln zugewiesen</Typography>
                    )}
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Verfügbare Regeln hinzufügen:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {availableRules
                      .filter((rule) => !cloneWeaponRules.some((id) => Number(id) === Number(rule.id)))
                      .map((rule) => (
                        <Chip
                          key={rule.id}
                          label={rule.name}
                          onClick={() => setCloneWeaponRules([...cloneWeaponRules, Number(rule.id)])}
                          variant="outlined"
                        />
                      ))}
                  </Stack>
                </TabPanel>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={Boolean(cloneSourceWeapon) && !cloneRelationsReady}>
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
