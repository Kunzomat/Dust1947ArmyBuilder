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
  Tabs,
  Tab,
  Chip,
  Stack
  ,FormControl
  ,InputLabel
  ,Select
  ,TableSortLabel
} from '@mui/material';
import { Edit, Delete, Add, Link as LinkIcon, ContentCopy, CheckCircle } from '@mui/icons-material';
import { getImageUrl } from '../../imageHelper';

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

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const LEVEL_OPTIONS_BY_TYPE = {
  I: ['1', '2', '3', '4'],
  V: ['1', '2', '3', '4', '5', '6', '7'],
  A: ['1', '2', '3'],
  H: ['1', '2', '3', '4'],
};

const normalizeIntegerString = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numeric = String(value).replace(/[^0-9]/g, '');
  if (numeric === '') return '';
  return String(parseInt(numeric, 10));
};

const STAT_TYPE_ORDER = { I: 1, V: 2, A: 3 };
const TARGET_TYPE_LEVELS = {
  I: [1, 2, 3, 4],
  V: [1, 2, 3, 4, 5, 6, 7],
  A: [1, 2, 3],
};
const TARGET_TYPE_LABELS = {
  I: 'Infantry',
  V: 'Vehicle',
  A: 'Aircraft',
};

const formatWeaponStatLine = (stats = []) => {
  const ordered = [...stats].sort((a, b) => {
    const typeDiff = (STAT_TYPE_ORDER[a.target_type] || 99) - (STAT_TYPE_ORDER[b.target_type] || 99);
    if (typeDiff !== 0) return typeDiff;
    return Number(a.target_level || 0) - Number(b.target_level || 0);
  });

  if (!ordered.length) return 'Keine Stat-Line vorhanden';

  return ordered
    .map((stat) => `${stat.target_type}${stat.target_level}: ${stat.dice || '-'} / ${stat.damage || '-'}`)
    .join(' · ');
};

const getWeaponStatlineRows = (stats = []) => {
  const statsMap = new Map(
    stats.map((stat) => [
      `${String(stat.target_type || '').toUpperCase()}-${Number(stat.target_level)}`,
      {
        dice: stat.dice || '-',
        damage: stat.damage || '-',
      },
    ])
  );

  return ['I', 'V', 'A'].map((targetType) => {
    const values = (TARGET_TYPE_LEVELS[targetType] || []).map((level) => {
      const key = `${targetType}-${level}`;
      const stat = statsMap.get(key) || { dice: '-', damage: '-' };
      return `${targetType}${level}: ${stat.dice}/${stat.damage}`;
    });

    return {
      targetType,
      label: TARGET_TYPE_LABELS[targetType] || targetType,
      value: values.join('   |   '),
    };
  });
};

const toFormValue = (value) => (value === null || value === undefined ? '' : String(value));
const toIdList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Bild konnte nicht verarbeitet werden.'));
    image.src = src;
  });

async function optimizeImageForUpload(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const mimeType = file.type || 'image/png';

  if (mimeType === 'image/svg+xml') {
    return originalDataUrl;
  }

  const image = await loadImageElement(originalDataUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);

  const exportType = ['image/jpeg', 'image/webp', 'image/png'].includes(mimeType)
    ? mimeType
    : 'image/jpeg';

  return canvas.toDataURL(exportType, 0.85);
}

export default function UnitManager() {
  const [units, setUnits] = useState([]);
  const [factions, setFactions] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [rules, setRules] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const [editingUnit, setEditingUnit] = useState(null);
  const [cloneSourceUnit, setCloneSourceUnit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitWeapons, setUnitWeapons] = useState([]);
  const [unitRules, setUnitRules] = useState([]);
  const [filterGameSystemId, setFilterGameSystemId] = useState('');
  const [filterFactionId, setFilterFactionId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
   const [uploadedImageName, setUploadedImageName] = useState('');
   const [imageOptions, setImageOptions] = useState([]);
   const [imagePreviewSrc, setImagePreviewSrc] = useState('');
   const [isUploadingImage, setIsUploadingImage] = useState(false);
   const [calculatedPointsCache, setCalculatedPointsCache] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    faction_id: '',
    type: '',
    level: '',
    points: '',
    speed: '',
    march_speed: '',
    health: '',
    image_url: '',
    notes: '',
    game_system_id: ''
  });

   const [currentWeaponForm, setCurrentWeaponForm] = useState({
     weapon_id: '',
     number: 1,
     firing_arc: ''
   });

   const [weaponFilterGameSystemId, setWeaponFilterGameSystemId] = useState('');
   const [weaponFilterFactionId, setWeaponFilterFactionId] = useState('');
   const [weaponFilterName, setWeaponFilterName] = useState('');

   const [editingAssignedWeapon, setEditingAssignedWeapon] = useState(null);

   useEffect(() => {
     loadUnits();
     loadFactions();
     loadWeapons();
     loadRules();
     loadGameSystems();
     loadImageOptions();
   }, []);

   // Load calculated points for all units when units change
   useEffect(() => {
     const loadAllCalculatedPoints = async () => {
       console.log('Starting to load calculated points for', units.length, 'units');
       const newCache = {};
       for (const unit of units) {
         try {
           console.log(`Fetching calculated points for unit ${unit.id}`);
           const data = await adminApiCall(`admin_api.php?action=units.calculate_points&id=${unit.id}`);
           console.log(`Received points for unit ${unit.id}:`, data.theoretical_points);
           newCache[unit.id] = data.theoretical_points;
         } catch (error) {
           console.error(`Error calculating points for unit ${unit.id}:`, error);
         }
       }
       console.log('New cache:', newCache);
       setCalculatedPointsCache((prev) => ({ ...prev, ...newCache }));
     };
     
     if (units.length > 0) {
       loadAllCalculatedPoints();
     }
   }, [units]);

  const getSortValue = (unit, column) => {
    switch (column) {
      case 'id':
        return Number(unit.id) || 0;
      case 'name':
        return String(unit.name || '').toLowerCase();
      case 'faction_name':
        return String(unit.faction_name || '').toLowerCase();
      case 'game_system_name':
        return String(unit.game_system_name || '').toLowerCase();
      case 'type':
        return String(unit.type || '').toLowerCase();
      case 'points':
        return Number(unit.points) || 0;
      default:
        return '';
    }
  };

  const filteredAndSortedUnits = useMemo(() => {
    const filtered = units.filter((unit) => {
      if (filterGameSystemId && String(unit.game_system_id || '') !== String(filterGameSystemId)) {
        return false;
      }
      if (filterFactionId && String(unit.faction_id || '') !== String(filterFactionId)) {
        return false;
      }
      if (filterType && String(unit.type || '') !== String(filterType)) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortBy);
      const bValue = getSortValue(b, sortBy);

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [units, filterGameSystemId, filterFactionId, filterType, sortBy, sortDirection]);

  const availableFactionsForFilter = useMemo(() => {
    if (!filterGameSystemId) {
      return factions;
    }

    return factions.filter(
      (faction) => String(faction.game_system_id || '') === String(filterGameSystemId)
    );
  }, [factions, filterGameSystemId]);

  const availableFactionsForForm = useMemo(() => {
    if (!formData.game_system_id) {
      return factions;
    }

    return factions.filter(
      (faction) => String(faction.game_system_id || '') === String(formData.game_system_id)
    );
  }, [factions, formData.game_system_id]);

  const availableWeaponFactions = useMemo(() => {
    if (!weaponFilterGameSystemId) {
      return factions;
    }

    return factions.filter(
      (faction) => String(faction.game_system_id || '') === String(weaponFilterGameSystemId)
    );
  }, [factions, weaponFilterGameSystemId]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const allowedLevels = LEVEL_OPTIONS_BY_TYPE[formData.type] || [];
  const resolvedImagePreviewSrc = imagePreviewSrc || (formData.image_url ? getImageUrl(formData.image_url) : null);
  const isUploadedImage = Boolean(uploadedImageName);
  const imageDisplayLabel = !formData.image_url
    ? 'Kein Bild ausgewählt'
    : isUploadedImage
      ? uploadedImageName || 'Hochgeladenes Bild'
      : formData.image_url;

  const selectedWeaponForPreview = useMemo(
    () => weapons.find((weapon) => String(weapon.id) === String(currentWeaponForm.weapon_id)) || null,
    [weapons, currentWeaponForm.weapon_id]
  );

  const filteredWeaponsForAssignment = useMemo(() => {
    const normalizedName = String(weaponFilterName || '').trim().toLowerCase();

    return weapons.filter((weapon) => {
      const matchesName = !normalizedName || String(weapon.name || '').toLowerCase().includes(normalizedName);
      const matchesGameSystem = !weaponFilterGameSystemId
        || weapon.game_system_id === null
        || weapon.game_system_id === undefined
        || String(weapon.game_system_id) === String(weaponFilterGameSystemId);
      const matchesFaction = !weaponFilterFactionId
        || (Array.isArray(weapon.faction_ids_list) && weapon.faction_ids_list.includes(String(weaponFilterFactionId)));

      return matchesName && matchesGameSystem && matchesFaction;
    });
  }, [weapons, weaponFilterName, weaponFilterGameSystemId, weaponFilterFactionId]);

  const weaponOptionsForSelect = useMemo(() => {
    if (!selectedWeaponForPreview) {
      return filteredWeaponsForAssignment;
    }

    const hasSelectedWeapon = filteredWeaponsForAssignment.some(
      (weapon) => String(weapon.id) === String(selectedWeaponForPreview.id)
    );

    return hasSelectedWeapon
      ? filteredWeaponsForAssignment
      : [selectedWeaponForPreview, ...filteredWeaponsForAssignment];
  }, [filteredWeaponsForAssignment, selectedWeaponForPreview]);

  const editingAssignedWeaponDetails = useMemo(
    () => weapons.find((weapon) => String(weapon.id) === String(editingAssignedWeapon?.weaponId)) || null,
    [weapons, editingAssignedWeapon?.weaponId]
  );

  const handleNumericChange = (field, value) => {
    setFormData({ ...formData, [field]: value.replace(/[^0-9]/g, '') });
  };

  const loadImageOptions = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=images.list');
      setImageOptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading image options:', error);
      setImageOptions([]);
    }
  };

  const resetImagePreview = () => {
    setImagePreviewSrc((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return '';
    });
  };

  const handleImageFile = async (file) => {
    if (!file) return;

    resetImagePreview();
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreviewSrc(localPreviewUrl);
    setUploadedImageName(file.name || 'Hochgeladenes Bild');

    try {
      setIsUploadingImage(true);
      const optimizedImageData = await optimizeImageForUpload(file);
      const response = await adminApiCall('admin_api.php?action=images.upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: optimizedImageData,
          originalName: file.name || 'image.png',
        }),
      });

      setFormData((prev) => ({ ...prev, image_url: response.filename || '' }));
      await loadImageOptions();
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadedImageName('');
      setFormData((prev) => ({ ...prev, image_url: '' }));
      resetImagePreview();
      alert('Fehler beim Hochladen des Bildes: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
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


  const loadWeapons = async () => {
    try {
      const data = await adminApiCall('admin_api.php?action=weapons.list');
      if (Array.isArray(data)) {
        const enrichedWeapons = await Promise.all(
          data.map(async (weapon) => {
            try {
              const stats = await adminApiCall(`admin_api.php?action=weapon_stats.list&weapon_id=${weapon.id}`);
              return {
                ...weapon,
                faction_ids_list: toIdList(weapon.faction_ids),
                stats: Array.isArray(stats) ? stats : [],
                stat_line: formatWeaponStatLine(Array.isArray(stats) ? stats : []),
              };
            } catch (error) {
              console.error(`Error loading stats for weapon ${weapon.id}:`, error);
              return {
                ...weapon,
                faction_ids_list: toIdList(weapon.faction_ids),
                stats: [],
                stat_line: 'Keine Stat-Line vorhanden',
              };
            }
          })
        );

        setWeapons(enrichedWeapons);
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

  const getUnitFormData = (unit) => ({
    name: unit?.name || '',
    faction_id: unit?.faction_id || '',
    game_system_id: unit?.game_system_id || '',
    type: unit?.type || '',
    level: toFormValue(unit?.level),
    points: toFormValue(unit?.points),
    speed: toFormValue(unit?.speed),
    march_speed: toFormValue(unit?.march_speed),
    health: toFormValue(unit?.health),
    image_url: unit?.image_url || '',
    notes: unit?.notes || ''
  });

  const handleOpenDialog = (unit = null, options = {}) => {
    const { clone = false } = options;

    if (unit) {
      setEditingUnit(clone ? null : unit);
      setCloneSourceUnit(clone ? unit : null);
      setFormData({
        ...getUnitFormData(unit),
        name: clone ? `${unit.name} (Kopie)` : unit.name || ''
      });
    } else {
      setEditingUnit(null);
      setCloneSourceUnit(null);
      setFormData(getUnitFormData(null));
    }

    setUploadedImageName('');
    resetImagePreview();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUnit(null);
    setCloneSourceUnit(null);
    setUploadedImageName('');
    resetImagePreview();
  };

  const handleSave = async () => {
    try {
      const isClone = !editingUnit && Boolean(cloneSourceUnit?.id);
      const action = editingUnit ? 'units.update' : (isClone ? 'units.clone' : 'units.create');
      const payload = {
        ...(editingUnit ? { ...formData, id: editingUnit.id } : formData),
        ...(isClone ? { id: cloneSourceUnit.id } : {}),
        faction_id: formData.faction_id ? parseInt(formData.faction_id, 10) : null,
        game_system_id: formData.game_system_id ? parseInt(formData.game_system_id, 10) : null,
        points: formData.points === '' ? 0 : parseInt(formData.points, 10) || 0,
        speed: formData.speed === '' ? 0 : parseInt(formData.speed, 10) || 0,
        march_speed: formData.march_speed === '' ? 0 : parseInt(formData.march_speed, 10) || 0,
        health: formData.health === '' ? 0 : parseInt(formData.health, 10) || 0,
      };
      
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
    setCurrentWeaponForm({ weapon_id: '', number: 1, firing_arc: '' });
    setWeaponFilterName('');
    setWeaponFilterGameSystemId(unit?.game_system_id ? String(unit.game_system_id) : '');
    setWeaponFilterFactionId('');
    loadUnitRelations(unit.id);
    setRelationDialogOpen(true);
    setEditingAssignedWeapon(null);
  };

  const handleAddWeapon = async (weaponId, number = 1, firingArc = '') => {
    try {
      await adminApiCall('admin_api.php?action=unit_weapons.add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          weapon_id: weaponId,
          number: Number(number) || 1,
          firing_arc: firingArc || null
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error adding weapon:', error);
      alert('Fehler: ' + error.message);
    }
  };

  const handleRemoveWeapon = async (weaponAssignmentId, weaponId) => {
    try {
      await adminApiCall('admin_api.php?action=unit_weapons.remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          weapon_assignment_id: weaponAssignmentId,
          weapon_id: weaponId
        })
      });
      loadUnitRelations(selectedUnit.id);
    } catch (error) {
      console.error('Error removing weapon:', error);
    }
  };

  const handleStartEditAssignedWeapon = (uw) => {
    const assignmentId = uw.unit_weapon_id ?? uw.id;
    const amount = Math.max(1, Number(uw.quantity ?? uw.number ?? 1) || 1);
    const arcCode = String(uw.firing_arc || '').toUpperCase();

    setEditingAssignedWeapon({
      assignmentId,
      weaponId: uw.weapon_id,
      weaponName: uw.weapon_name,
      number: amount,
      firing_arc: ['L', 'R', 'F', 'T', 'REAR'].includes(arcCode) ? arcCode : 'F',
    });
  };

  const handleUpdateAssignedWeapon = async () => {
    if (!editingAssignedWeapon?.assignmentId) return;

    try {
      await adminApiCall('admin_api.php?action=unit_weapons.update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          weapon_assignment_id: editingAssignedWeapon.assignmentId,
          number: Math.max(1, Number(editingAssignedWeapon.number) || 1),
          firing_arc: editingAssignedWeapon.firing_arc || 'F',
        }),
      });

      await loadUnitRelations(selectedUnit.id);
      setEditingAssignedWeapon(null);
    } catch (error) {
      console.error('Error updating assigned weapon:', error);
      alert('Fehler beim Aktualisieren: ' + error.message);
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

   const handleRemoveRule = async (assignmentId) => {
     try {
       await adminApiCall('admin_api.php?action=unit_rules.remove', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           unit_id: selectedUnit.id,
            id: assignmentId
         })
       });
       loadUnitRelations(selectedUnit.id);
     } catch (error) {
       console.error('Error removing rule:', error);
     }
   };

   const loadCalculatedPoints = async (unitId) => {
     try {
       const data = await adminApiCall(`admin_api.php?action=units.calculate_points&id=${unitId}`);
       setCalculatedPointsCache(prev => ({
         ...prev,
         [unitId]: data.theoretical_points
       }));
       return data.theoretical_points;
     } catch (error) {
       console.error('Error calculating points:', error);
       return null;
     }
   };

   const handleApplyCalculatedPoints = async (unit) => {
     try {
       // Get or calculate the theoretical points
       let theoreticalPoints = calculatedPointsCache[unit.id];
       if (theoreticalPoints === undefined) {
         theoreticalPoints = await loadCalculatedPoints(unit.id);
       }

       if (theoreticalPoints === null) {
         alert('Fehler bei der Berechnung der Punkte');
         return;
       }

       // Update the unit with the theoretical points
       const payload = {
         id: unit.id,
         name: unit.name,
         faction_id: unit.faction_id,
         game_system_id: unit.game_system_id || null,
         type: unit.type,
         points: theoreticalPoints,
         level: unit.level,
         speed: unit.speed,
         march_speed: unit.march_speed,
         health: unit.health,
         image_url: unit.image_url,
         notes: unit.notes
       };

       await adminApiCall('admin_api.php?action=units.update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });

       // Reload the units
       loadUnits();
       alert(`✅ Punkte aktualisiert: ${unit.points} → ${theoreticalPoints}`);
     } catch (error) {
       console.error('Error applying calculated points:', error);
       alert('Fehler beim Speichern: ' + error.message);
     }
   };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Units ({filteredAndSortedUnits.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="units-game-system-filter-label">Game System</InputLabel>
            <Select
              labelId="units-game-system-filter-label"
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
            <InputLabel id="units-faction-filter-label">Faction</InputLabel>
            <Select
              labelId="units-faction-filter-label"
              value={filterFactionId}
              label="Faction"
              onChange={(e) => setFilterFactionId(e.target.value)}
            >
              <MenuItem value="">Alle Factions</MenuItem>
              {availableFactionsForFilter.map((faction) => (
                <MenuItem key={faction.id} value={String(faction.id)}>
                  {faction.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="units-type-filter-label">Type</InputLabel>
            <Select
              labelId="units-type-filter-label"
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="">Alle Typen</MenuItem>
              <MenuItem value="I">I - Infantry</MenuItem>
              <MenuItem value="V">V - Vehicle</MenuItem>
              <MenuItem value="A">A - Aircraft</MenuItem>
              <MenuItem value="H">H - Hero</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Neue Unit
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
                 <TableSortLabel active={sortBy === 'faction_name'} direction={sortBy === 'faction_name' ? sortDirection : 'asc'} onClick={() => handleSort('faction_name')}>
                   Faction
                 </TableSortLabel>
               </TableCell>
               <TableCell>
                 <TableSortLabel active={sortBy === 'game_system_name'} direction={sortBy === 'game_system_name' ? sortDirection : 'asc'} onClick={() => handleSort('game_system_name')}>
                   Game System
                 </TableSortLabel>
               </TableCell>
               <TableCell>
                 <TableSortLabel active={sortBy === 'type'} direction={sortBy === 'type' ? sortDirection : 'asc'} onClick={() => handleSort('type')}>
                   Type
                 </TableSortLabel>
               </TableCell>
               <TableCell>
                 <TableSortLabel active={sortBy === 'points'} direction={sortBy === 'points' ? sortDirection : 'asc'} onClick={() => handleSort('points')}>
                   Punkte
                 </TableSortLabel>
               </TableCell>
               <TableCell>Stats</TableCell>
               <TableCell align="right">Aktionen</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {filteredAndSortedUnits.map((unit) => (
               <TableRow key={unit.id}>
                 <TableCell>{unit.id}</TableCell>
                 <TableCell><strong>{unit.name}</strong></TableCell>
                 <TableCell>{unit.faction_name}</TableCell>
                 <TableCell>{unit.game_system_name || 'Alle'}</TableCell>
                 <TableCell>{unit.type || '-'}</TableCell>
                 <TableCell>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Typography variant="body2">{unit.points}</Typography>
                     {calculatedPointsCache[unit.id] !== undefined && calculatedPointsCache[unit.id] !== unit.points && (
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                         <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                           {calculatedPointsCache[unit.id]}
                         </Typography>
                         <IconButton
                           size="small"
                           color="success"
                           onClick={() => handleApplyCalculatedPoints(unit)}
                           title="Berechnete Punkte übernehmen"
                           sx={{ p: 0.25 }}
                         >
                           <CheckCircle fontSize="small" />
                         </IconButton>
                       </Box>
                     )}
                   </Box>
                 </TableCell>
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
                     color="secondary"
                      onClick={() => handleOpenDialog(unit, { clone: true })}
                     title="Unit klonen"
                   >
                     <ContentCopy />
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
          {editingUnit ? 'Unit bearbeiten' : (cloneSourceUnit ? 'Unit klonen' : 'Neue Unit')}
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
                disabled={Boolean(formData.game_system_id) && availableFactionsForForm.length === 0}
                onChange={(e) => setFormData({ ...formData, faction_id: e.target.value })}
              >
                {availableFactionsForForm.length === 0 && (
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
                select
                label="Type"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, level: '' })}
              >
                <MenuItem value="I">I - Infantry</MenuItem>
                <MenuItem value="V">V - Vehicle</MenuItem>
                <MenuItem value="A">A - Aircraft</MenuItem>
                <MenuItem value="H">H - Hero</MenuItem>
              </TextField>

              <TextField
                select
                label="Level"
                value={formData.level || ''}
                disabled={!formData.type}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                helperText={formData.type ? 'Nur erlaubte Werte für den gewählten Typ' : 'Bitte zuerst einen Typ wählen'}
              >
                {allowedLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
              <TextField
                type="text"
                label="Punkte"
                value={formData.points}
                onChange={(e) => handleNumericChange('points', e.target.value)}
                onBlur={(e) => setFormData({ ...formData, points: normalizeIntegerString(e.target.value) })}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
              <TextField
                type="text"
                label="Health"
                value={formData.health}
                onChange={(e) => handleNumericChange('health', e.target.value)}
                onBlur={(e) => setFormData({ ...formData, health: normalizeIntegerString(e.target.value) })}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText="Lebenspunkte"
              />
              <TextField
                type="text"
                label="Speed"
                value={formData.speed}
                onChange={(e) => handleNumericChange('speed', e.target.value)}
                onBlur={(e) => setFormData({ ...formData, speed: normalizeIntegerString(e.target.value) })}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText="Bewegung"
              />
              <TextField
                type="text"
                label="March Speed"
                value={formData.march_speed}
                onChange={(e) => handleNumericChange('march_speed', e.target.value)}
                onBlur={(e) => setFormData({ ...formData, march_speed: normalizeIntegerString(e.target.value) })}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText="Marsch"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start' }}>
              <TextField
                fullWidth
                select
                label="Bild aus dem Verzeichnis"
                value={imageOptions.includes(formData.image_url) ? formData.image_url : ''}
                onChange={(e) => {
                  setUploadedImageName('');
                  resetImagePreview();
                  setFormData({ ...formData, image_url: e.target.value });
                }}
                helperText="Ein vorhandenes Bild aus `backend/images` auswählen"
              >
                <MenuItem value="">Keins auswählen</MenuItem>
                {imageOptions.map((image) => (
                  <MenuItem key={image} value={image}>
                    {image}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="outlined" component="label" sx={{ height: 56, alignSelf: 'center' }} disabled={isUploadingImage}>
                {isUploadingImage ? 'Bild wird hochgeladen…' : 'Bild hochladen'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </Button>
            </Box>

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                minHeight: 128,
              }}
            >
              {resolvedImagePreviewSrc ? (
                <Box
                  component="img"
                  src={resolvedImagePreviewSrc}
                  alt="Vorschau"
                  sx={{
                    width: 96,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontSize: 12,
                    textAlign: 'center',
                    px: 1,
                  }}
                >
                  Keine Vorschau
                </Box>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Aktuelles Bild</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {imageDisplayLabel}
                </Typography>
                {isUploadedImage && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Lokale Vorschau aus dem gewählten Upload
                  </Typography>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Besondere Hinweise zur Einheit"
            />
            {isUploadingImage && (
              <Typography variant="caption" color="warning.main">
                Bild wird gerade hochgeladen. Bitte kurz warten, bevor du speicherst.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={isUploadingImage}>
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
              {unitWeapons.map((uw) => {
                const amount = Math.max(1, Number(uw.quantity ?? uw.number ?? 1) || 1);
                const arcCode = String(uw.firing_arc || '').toUpperCase();
                const arcLabelMap = { L: 'Left', R: 'Right', F: 'Front', T: 'Turret', REAR: 'Rear' };
                const arcLabel = arcLabelMap[arcCode] || arcCode || '-';
                const assignmentId = uw.unit_weapon_id ?? uw.id;
                const assignmentKey = assignmentId ?? `${uw.unit_id}-${uw.weapon_id}-${arcCode}-${amount}`;

                return (
                <Chip
                  key={assignmentKey}
                  label={`${uw.weapon_name} (${amount}x) Arc: ${arcLabel}`}
                  onClick={() => handleStartEditAssignedWeapon(uw)}
                  onDelete={() => handleRemoveWeapon(assignmentId, uw.weapon_id)}
                  color="primary"
                  variant={editingAssignedWeapon?.assignmentId === assignmentId ? 'filled' : 'outlined'}
                  title="Klicken zum Bearbeiten"
                />
                );
              })}
              {unitWeapons.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Keine Waffen zugewiesen
                </Typography>
              )}
            </Stack>

            {editingAssignedWeapon && (
              <Box sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, p: 2, mb: 2, backgroundColor: 'rgba(25,118,210,0.04)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  ⚙️ Zugewiesene Waffe bearbeiten: {editingAssignedWeapon.weaponName}
                </Typography>

                <Box
                  sx={{
                    mb: 1.5,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'primary.dark', fontWeight: 700 }}>
                    Vollst\u00e4ndige Stat-Line
                  </Typography>
                  {editingAssignedWeaponDetails ? (
                    getWeaponStatlineRows(editingAssignedWeaponDetails.stats).map((row) => (
                      <Typography
                        key={`edit-${row.targetType}`}
                        variant="body2"
                        sx={{ fontFamily: 'monospace', lineHeight: 1.45, mb: 0.25 }}
                      >
                        {row.label}: {row.value}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Keine Stat-Line f\u00fcr diese Waffe gefunden.
                    </Typography>
                  )}
                </Box>

                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'flex-end' }}>
                  <TextField
                    type="number"
                    label="Anzahl"
                    value={editingAssignedWeapon.number}
                    onChange={(e) =>
                      setEditingAssignedWeapon((prev) => ({
                        ...prev,
                        number: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ minWidth: 120 }}
                  />

                  <TextField
                    select
                    label="Schussrichtung"
                    value={editingAssignedWeapon.firing_arc}
                    onChange={(e) =>
                      setEditingAssignedWeapon((prev) => ({
                        ...prev,
                        firing_arc: e.target.value,
                      }))
                    }
                    sx={{ minWidth: 170 }}
                  >
                    <MenuItem value="L">L - Left</MenuItem>
                    <MenuItem value="R">R - Right</MenuItem>
                    <MenuItem value="F">F - Front</MenuItem>
                    <MenuItem value="REAR">REAR - Rear</MenuItem>
                    <MenuItem value="T">T - Turret</MenuItem>
                  </TextField>

                  <Button variant="contained" onClick={handleUpdateAssignedWeapon}>
                    Speichern
                  </Button>
                  <Button variant="text" onClick={() => setEditingAssignedWeapon(null)}>
                    Abbrechen
                  </Button>
                </Stack>
              </Box>
            )}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                ➕ Neue Waffe hinzufügen:
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  mb: 2,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.25fr' },
                }}
              >
                <TextField
                  select
                  label="Filter Game System"
                  value={weaponFilterGameSystemId}
                  onChange={(e) => {
                    setWeaponFilterGameSystemId(e.target.value);
                    setWeaponFilterFactionId('');
                  }}
                  fullWidth
                >
                  <MenuItem value="">Alle Systeme</MenuItem>
                  {gameSystems.map((system) => (
                    <MenuItem key={system.id} value={String(system.id)}>
                      {system.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Filter Fraktion"
                  value={weaponFilterFactionId}
                  onChange={(e) => setWeaponFilterFactionId(e.target.value)}
                  fullWidth
                  helperText="Filtert nach vorhandenen Unit-Zuweisungen"
                >
                  <MenuItem value="">Alle Fraktionen</MenuItem>
                  {availableWeaponFactions.map((faction) => (
                    <MenuItem key={faction.id} value={String(faction.id)}>
                      {faction.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Name filtern"
                  value={weaponFilterName}
                  onChange={(e) => setWeaponFilterName(e.target.value)}
                  placeholder="z.B. Blaster, Cannon, Bazooka"
                  fullWidth
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {filteredWeaponsForAssignment.length} Waffen im Filter gefunden
              </Typography>

              <Box
                sx={{
                  width: '100%',
                  mb: 2,
                  p: 1.25,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'primary.dark', fontWeight: 700 }}>
                  Vollständige Stat-Line der ausgewählten Waffe
                </Typography>
                {selectedWeaponForPreview ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 700 }}>
                      {selectedWeaponForPreview.name}
                    </Typography>
                    {getWeaponStatlineRows(selectedWeaponForPreview.stats).map((row) => (
                      <Typography
                        key={row.targetType}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          lineHeight: 1.45,
                          whiteSpace: 'normal',
                          mb: 0.25,
                        }}
                      >
                        {row.label}: {row.value}
                      </Typography>
                    ))}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Bitte eine Waffe auswählen, um die komplette Stat-Line zu sehen.
                  </Typography>
                )}
              </Box>

              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                  select
                  label="Waffe"
                  value={currentWeaponForm.weapon_id}
                  onChange={(e) => setCurrentWeaponForm({ ...currentWeaponForm, weapon_id: e.target.value })}
                  fullWidth
                  sx={{ minWidth: 250, flex: 1 }}
                >
                  <MenuItem value="">Wählen...</MenuItem>
                  {weaponOptionsForSelect.map((weapon) => (
                    <MenuItem
                      key={weapon.id}
                      value={weapon.id}
                      title={`${weapon.stat_line || 'Keine Stat-Line vorhanden'}${weapon.game_system_name ? ` · ${weapon.game_system_name}` : ''}${weapon.faction_names ? ` · ${weapon.faction_names}` : ''}`}
                    >
                        {weapon.name}
                      </MenuItem>
                    ))}
                  {weaponOptionsForSelect.length === 0 && (
                    <MenuItem value="" disabled>
                      Keine Waffen gefunden
                    </MenuItem>
                  )}
                </TextField>

                <TextField
                  type="number"
                  label="Anzahl"
                  value={currentWeaponForm.number}
                  onChange={(e) => setCurrentWeaponForm({ ...currentWeaponForm, number: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ minWidth: 100 }}
                />
                
                <TextField
                  select
                  label="Schussrichtung"
                  value={currentWeaponForm.firing_arc}
                  onChange={(e) => setCurrentWeaponForm({ ...currentWeaponForm, firing_arc: e.target.value })}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Keine</MenuItem>
                  <MenuItem value="L">L - Left</MenuItem>
                  <MenuItem value="R">R - Right</MenuItem>
                  <MenuItem value="F">F - Front</MenuItem>
                  <MenuItem value="REAR">REAR - Rear</MenuItem>
                  <MenuItem value="T">T - Turret</MenuItem>
                </TextField>
                
                <Button
                  variant="contained"
                  onClick={() => {
                    if (currentWeaponForm.weapon_id) {
                      handleAddWeapon(
                        currentWeaponForm.weapon_id,
                        currentWeaponForm.number,
                        currentWeaponForm.firing_arc
                      );
                      setCurrentWeaponForm({ weapon_id: '', number: 1, firing_arc: '' });
                    } else {
                      alert('Bitte wähle eine Waffe');
                    }
                  }}
                  sx={{
                    minWidth: 120,
                    height: 56,
                    alignSelf: { xs: 'stretch', sm: 'flex-end' },
                  }}
                >
                  Hinzufügen
                </Button>
              </Stack>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Zugewiesene Regeln:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
              {unitRules.map((ur) => (
                <Chip
                  key={ur.id}
                  label={ur.rule_name}
                  onDelete={() => handleRemoveRule(ur.id)}
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

