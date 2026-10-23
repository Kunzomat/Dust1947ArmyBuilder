import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./apiClient";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Settings, Build, List as ListIcon, Groups, Description, ContentCopy, Edit, Delete, Add, PictureAsPdf } from "@mui/icons-material";
import ConfirmDialog from "./components/ConfirmDialog";
import ArmyFormDialog from "./components/ArmyFormDialog";
import AddPlatoonDialog from "./components/AddPlatoonDialog";
import AddUnitDialog from "./components/AddUnitDialog";
import UnitCard from "./components/UnitCard";
import AdminPanel from "./components/AdminPanel";
import { getImageUrl, getPlaceholderImage } from "./imageHelper";
import { validateArmyComposition } from "./armyValidation";
import { aggregateArmyUnits, getRemovalRequest } from "./armyUnitAggregation";
import { exportArmyCardsPdf } from "./utils/armyPdfExport";
import {
  filterArmies,
  getBlocsForGameSystem,
  getGameSystems,
} from "./armyFilters";
import useSessionStorageState from "./hooks/useSessionStorageState";

function ColumnPaper({ title, children, sx, hidden, mobile, action }) {
  return (
    <Paper
      elevation={2}
      sx={{
        height: mobile ? "auto" : "calc(100vh - 64px - 16px)",
        display: hidden ? "none" : "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        {action}
      </Box>
      <Divider />
      <Box sx={{ p: 1.5, overflow: "auto", flex: 1 }}>{children}</Box>
    </Paper>
  );
}

export default function App() {
  const isMobile = useMediaQuery("(max-width: 899.95px)");
  const [activePane, setActivePane] = useState("armies");
  const isDesktop = useMemo(
    () => window.matchMedia("(min-width: 900px)").matches,
    []
  );

  // Mode: 'builder' or 'admin'
  // Restore last mode after a reload (e.g. F5 while in Admin Panel stays in Admin Panel).
  const [mode, setMode] = useState(() => {
    const saved = sessionStorage.getItem('dust1947_mode');
    return saved === 'admin' ? 'admin' : 'builder';
  });

  useEffect(() => {
    sessionStorage.setItem('dust1947_mode', mode);
  }, [mode]);
  //const [activePane, setActivePane] = useState("armies");

	const [armies, setArmies] = useState([]);
	const [selectedArmyUnitId, setSelectedArmyUnitId] = useState(null);
	const [selectedUnitId, setSelectedUnitId] = useState(null);
	const [selectedArmyId, setSelectedArmyId] = useState(null);

  const [armyDetail, setArmyDetail] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [loadingArmies, setLoadingArmies] = useState(false);
  const [loadingArmy, setLoadingArmy] = useState(false);
  const [error, setError] = useState("");
  const [pdfProgress, setPdfProgress] = useState(null); // null = idle, else {done,total}
  const [confirmDeleteArmyId, setConfirmDeleteArmyId] = useState(null);
  
  const [armyFormOpen, setArmyFormOpen] = useState(false);
  const [armyFormArmy, setArmyFormArmy] = useState(null); // null = create

  const [factions, setFactions] = useState([]);
  const [blocs, setBlocs] = useState([]);
  const [gameSystems, setGameSystems] = useState([]);
  const [armyListFilters, setArmyListFilters] = useSessionStorageState(
    "dust1947.filters.v1.army-list",
    { selectedGameSystemId: "", selectedBlocFilterId: "" }
  );
  const { selectedGameSystemId, selectedBlocFilterId } = armyListFilters;
  const setSelectedGameSystemId = (value) =>
    setArmyListFilters((previous) => ({ ...previous, selectedGameSystemId: value }));
  const setSelectedBlocFilterId = (value) =>
    setArmyListFilters((previous) => ({ ...previous, selectedBlocFilterId: value }));
  
  const [availablePlatoons, setAvailablePlatoons] = useState([]);
  const [addPlatoonOpen, setAddPlatoonOpen] = useState(false);
  
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addUnitContext, setAddUnitContext] = useState(null);

  const [availableUnits, setAvailableUnits] = useState([]);
  
  const [platoonSlots, setPlatoonSlots] = useState({});

  const blocName = useMemo(() => {
    if (!armyDetail) return "";
    return (armyDetail.army || armyDetail).bloc_name || "";
  }, [armyDetail]);

  // Lookup of bloc_id -> game system name, used to explain why armies from
  // different game systems (Dust 1947, Warhammer 40k, Star Wars, ...) can
  // all exist side by side in this builder.
  const blocGameSystemById = useMemo(() => {
    const map = {};
    (blocs || []).forEach((b) => { map[b.id] = b.game_system_name; });
    return map;
  }, [blocs]);

  const gameSystemName = useMemo(() => {
    if (!armyDetail) return "";
    const army = armyDetail.army || armyDetail;
    return blocGameSystemById[army.bloc_id] || "";
  }, [armyDetail, blocGameSystemById]);

  const armyName = useMemo(() => {
    if (!armyDetail) return "";
    return (armyDetail.army || armyDetail).name || "";
  }, [armyDetail]);

  async function loadArmies() {
    setError("");
    setLoadingArmies(true);
    try {
      const data = await apiCall("armies.list");
      setArmies(data.armies || []);
      if (!selectedArmyId && data.armies?.length) {
        setSelectedArmyId(data.armies[0].id);
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoadingArmies(false);
    }
  }

  async function loadArmy(id) {
    if (!id) return;
    setError("");
    setLoadingArmy(true);
    try {
	  const data = await apiCall("armies.get", { id: id });
      setArmyDetail(data);
      setSelectedUnit(null);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoadingArmy(false);
    }
  }

  async function handleExportArmyPdf(id) {
    if (!id || pdfProgress !== null) return;
    setError("");
    setPdfProgress({ armyId: id, done: 0, total: 0 });
    try {
      const detail = await apiCall("armies.get", { id });
      const name = (detail.army || detail).name || "";
      await exportArmyCardsPdf(detail, name, (done, total) => setPdfProgress({ armyId: id, done, total }));
    } catch (e) {
      setError(`PDF-Export fehlgeschlagen: ${String(e.message || e)}`);
    } finally {
      setPdfProgress(null);
    }
  }

  async function refreshSelectedArmy(id = selectedArmyId) {
    if (!id) return;
    await Promise.all([loadArmy(id), loadArmies()]);
  }
  
  async function loadFactions() {
	try {
	  const data = await apiCall("factions.list");
	  setFactions(data.factions || []);
	} catch (e) {
	  setError(String(e.message || e));
	}
  }
  
  async function loadBlocs() {
    try {
      const data = await apiCall("blocs.list");
      setBlocs(data.blocs || []);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function loadGameSystems() {
    try {
      const data = await apiCall("game_systems.list");
      setGameSystems(data.game_systems || []);
    } catch (e) {
      // The bloc response also carries system data and is used as a fallback
      // by getGameSystems for older API installations.
      setGameSystems([]);
    }
  }
  
  async function loadAvailablePlatoons() {
    if (!armyDetail) return;
    try {
      const data = await apiCall("platoons.list", { bloc_id: armyDetail.army.bloc_id, });
      setAvailablePlatoons(data.platoons || []);
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  
	async function loadFreeUnits() {
		const data = await apiCall("unit.list");
		const bloc_id = armyDetail?.army?.bloc_id;

    return (data.units || []).filter(
      (u) => Number(u.bloc_id) === Number(bloc_id) || Boolean(Number(u.is_mercenary ?? 0))
    );
	}
  
  async function loadPlatoonSlotUnits(platoonId) {
    const data = await apiCall("platoon.units.list", { platoon_id: platoonId });
    setAvailableUnits(data.platoon_units || []);
  }
  
  async function loadPlatoonSlots(platoonId) {
    const data = await apiCall("platoon.units.list", { platoon_id: platoonId });
    setPlatoonSlots((prev) => ({...prev, [platoonId]: data.platoon_units || [],}));
  }

  
  async function handleArmyFormSubmit(data) {
  try {
    if (data.id) {
      await apiCall("armies.update", data, "POST");
      await loadArmy(data.id);
    } else {
      const created = await apiCall("armies.create", data, "POST");
      // Immediately select the newly created army instead of leaving the
      // user on the previous selection / no selection.
      setSelectedArmyId(created.id);
    }

    setArmyFormOpen(false);
    setArmyFormArmy(null);
    await loadArmies();
  } catch (e) {
    setError(String(e.message || e));
  }
}

  async function handleDeleteArmyConfirmed(id) {
	try {
	  await apiCall( "armies.delete", { id }, "POST");
		setSelectedArmyId(null);
		setArmyDetail(null);
    setSelectedArmyUnitId(null);
    setSelectedUnitId(null);

    // Do not rely on loadArmies seeing the just-cleared selection: this
    // handler's closure still has the pre-delete selectedArmyId. Select a
    // remaining army explicitly, or leave the builder in its empty state.
    const data = await apiCall("armies.list");
    const remainingArmies = data.armies || [];
    setArmies(remainingArmies);
    setSelectedArmyId(remainingArmies[0]?.id ?? null);
	  } catch (e) {
		setError(String(e.message || e));
	  }
	}

  async function handleEditArmy() {
	const newName = prompt("Neuer Name:", armyName);
	if (!newName) return;
	const newLimit = prompt("Neues Punktelimit:", pointsLimit);

	try {await apiCall("armies.update", {	id: selectedArmyId, name: newName, points_limit: Number(newLimit), }, "POST");
	  await loadArmy(selectedArmyId);
	  await loadArmies();
	} catch (e) {
	  setError(String(e.message || e));
	}
  }

  async function handleCloneArmy(armyId = selectedArmyId) {
    if (!armyId) return;
    try {
      const created = await apiCall("armies.clone", { id: armyId }, "POST");
      await loadArmies();
      setSelectedArmyId(created.id);
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  
  async function handleAddPlatoon(platoonId) {
    try {
      await apiCall(
        "army.platoons.add",
        { army_id: selectedArmyId, platoon_id: platoonId },
        "POST"
      );
      setAddPlatoonOpen(false);
      await refreshSelectedArmy();
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  
  async function handleRemovePlatoon(armyPlatoonId) {
    try {
      await apiCall(
        "army.platoons.remove",
        { id: armyPlatoonId },
        "POST"
      );
      await refreshSelectedArmy();
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  
	async function openAddFreeUnit() {
		setAddUnitContext(null);
		const units = await loadFreeUnits();
		setAvailableUnits(units);
		setAddUnitOpen(true);
	}

	function openAddPlatoonUnit({
		armyPlatoonId,
		platoonUnitId = null,
		slot,
		allowedUnits,
	}) {
		setAddUnitContext({
		army_platoon_id: armyPlatoonId,
		platoon_unit_id: platoonUnitId,
		slot,
	});

		setAvailableUnits(allowedUnits ?? []); // nur erlaubte Units
		setAddUnitOpen(true);
	}


	async function handleAddUnit(unit, quantity = 1) {
	  const payload = {
		army_id: selectedArmyId,
		unit_id: unit.unit_id || unit.id,
		quantity: Math.max(1, Number(quantity) || 1),
	  };

	  if (addUnitContext?.army_platoon_id) {
		payload.army_platoon_id = addUnitContext.army_platoon_id;

		if (Number.isInteger(addUnitContext.platoon_unit_id)) {
		  payload.platoon_unit_id = addUnitContext.platoon_unit_id;
		}

		// else → Support (NULL, korrekt)
	  }

	  console.log("ADD UNIT PAYLOAD", payload); // 🔍 Debug – sehr empfehlenswert

	  try {
		await apiCall("army.units.add", payload, "POST");
	  } catch (e) {
		return { ok: false, message: String(e.message || e) };
	  }

	  // Dialog stays open (context kept, so further units go to the same slot);
	  // only the army is refreshed. Refresh errors are reported via setError.
	  try {
		await refreshSelectedArmy();
	  } catch (e) {
		setError(String(e.message || e));
	  }
	  return { ok: true };
	}

	function handleCloseAddUnit() {
	  setAddUnitOpen(false);
	  setAddUnitContext(null);
	}

  async function handleRemoveOneUnit(group) {
    try {
      const request = getRemovalRequest(group);
      await apiCall(request.action, request.params, request.method);
      await refreshSelectedArmy();

      if (selectedArmyUnitId === group.unit.army_unit_id) {
        if (group.quantity === 1) {
          setSelectedArmyUnitId(null);
          setSelectedUnitId(null);
        } else if (group.units.length > 1 && Number(group.unit.quantity) === 1) {
          // The displayed group survives, but its representative row was
          // deleted. Keep selection attached to a surviving equivalent row.
          setSelectedArmyUnitId(group.units[1].army_unit_id);
        }
      }
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  // Clone = reverse of getRemovalRequest: increment the quantity of the
  // group's first persisted row (keeps platoon/slot/variant/equipment).
  async function handleCloneOneUnit(group) {
    try {
      const first = group.units[0];
      const quantity = Math.max(1, Number.parseInt(first.quantity, 10) || 1);
      await apiCall("army.units.update", { id: first.army_unit_id, quantity: quantity + 1 }, "POST");
      await refreshSelectedArmy();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  function renderUnitGroupRow(group) {
    return (
      <ListItem
        key={group.key}
        disablePadding
        sx={{ display: "flex", alignItems: "stretch" }}
      >
        <ListItemButton
          selected={selectedArmyUnitId === group.unit.army_unit_id}
          sx={{ flex: 1, minWidth: 0 }}
          onClick={() => {
            setSelectedArmyUnitId(group.unit.army_unit_id);
            setSelectedUnitId(group.unit.unit_id);
            if (isMobile) setActivePane('details');
          }}
        >
          <ListItemText
            sx={{ minWidth: 0, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word" }}
            primary={`${group.quantity}× ${group.unit.unit_name}`}
            secondary={`${group.quantity} × ${group.unitPoints} AP = ${group.groupPoints} AP`}
          />
        </ListItemButton>
        <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "flex-end", gap: 0.5, pl: 0.5 }}>
          <Tooltip title="Einheit klonen">
            <IconButton size="small" aria-label="Einheit klonen" onClick={(e) => { e.stopPropagation(); handleCloneOneUnit(group); }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Entfernen">
            <IconButton size="small" color="error" aria-label="Entfernen" onClick={(e) => { e.stopPropagation(); handleRemoveOneUnit(group); }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
    );
  }

	function isSlotUsed(platoonId, platoonUnitId) {
		return armyDetail.units.some(
			(u) => u.platoon_id === platoonId && u.platoon_unit_id === platoonUnitId
		);
	}
	
	function getUsedSlotsForArmyPlatoon(units, armyPlatoonId) {
		return units
			.filter((u) => u.army_platoon_id === armyPlatoonId)
			.map((u) => u.platoon_slot);
	}

function groupSlots(platoonUnits) {
  const map = new Map();

  for (const pu of platoonUnits) {
    if (!map.has(pu.slot)) {
      map.set(pu.slot, []);
    }
    map.get(pu.slot).push(pu);
  }

  return Array.from(map.entries()).map(([slot, units]) => ({
    slot,
    units,
  }));
}

  useEffect(() => { if (selectedArmyId) loadArmy(selectedArmyId);}, [selectedArmyId]);
  useEffect(() => { loadArmies(); loadFactions(); loadBlocs(); loadGameSystems();}, []);
  useEffect(() => { if (!addPlatoonOpen || !armyDetail) return; loadAvailablePlatoons(armyDetail.army.bloc_id);}, [addPlatoonOpen, armyDetail]);
  useEffect(() => { if (!armyDetail?.platoons) return; armyDetail.platoons.forEach((p) => {loadPlatoonSlots(p.platoon_id);});}, [armyDetail]);

  const filterGameSystems = useMemo(
    () => getGameSystems(gameSystems, blocs),
    [gameSystems, blocs]
  );
  const filterBlocs = useMemo(
    () => getBlocsForGameSystem(blocs, selectedGameSystemId),
    [blocs, selectedGameSystemId]
  );
  useEffect(() => {
    if (
      selectedGameSystemId !== "" &&
      filterGameSystems.length > 0 &&
      !filterGameSystems.some(
        (system) => String(system.id) === String(selectedGameSystemId)
      )
    ) {
      setArmyListFilters((previous) => ({ ...previous, selectedGameSystemId: "" }));
    }
  }, [filterGameSystems, selectedGameSystemId, setArmyListFilters]);
  const normalizedSelectedBlocFilterId = useMemo(
    () =>
      selectedBlocFilterId !== "" &&
      filterBlocs.some(
        (bloc) => String(bloc.id) === String(selectedBlocFilterId)
      )
        ? selectedBlocFilterId
        : "",
    [filterBlocs, selectedBlocFilterId]
  );
  const visibleArmies = useMemo(
    () =>
      filterArmies(
        armies,
        blocs,
        selectedGameSystemId,
        normalizedSelectedBlocFilterId
      ),
    [armies, blocs, selectedGameSystemId, normalizedSelectedBlocFilterId]
  );

  useEffect(() => {
    if (
      selectedBlocFilterId !== "" &&
      !filterBlocs.some((bloc) => String(bloc.id) === String(selectedBlocFilterId))
    ) {
      setArmyListFilters((previous) => ({ ...previous, selectedBlocFilterId: "" }));
    }
  }, [filterBlocs, selectedBlocFilterId, setArmyListFilters]);

  const freeUnits = useMemo(() => {
		if (!armyDetail) return [];
		return armyDetail.units.filter(
			(u) => u.army_platoon_id === null
		);
	}, [armyDetail]);
  const freeUnitGroups = useMemo(() => aggregateArmyUnits(freeUnits), [freeUnits]);

  const armyValidation = useMemo(() => {
    if (!armyDetail) return null;
    // Authoritative validation now runs server-side (see army_validation.php)
    // and is returned as part of armies.get. The client-side rule engine in
    // armyValidation.js is kept only as a fallback for older/offline API
    // responses that don't include a "validation" key yet.
    if (armyDetail.validation) return armyDetail.validation;
    return validateArmyComposition(armyDetail);
  }, [armyDetail]);
	
  const pointsUsed = armyValidation?.pointsUsed ?? armyDetail?.points_used ?? armyDetail?.army?.points_current ?? 0;
  const pointsLimit = armyValidation?.effectivePointsLimit ?? armyDetail?.army?.points_limit ?? 0;

  return (
    <Box sx={{ height: isMobile ? "auto" : "100vh", minHeight: isMobile ? "100vh" : undefined, maxWidth: "100vw", overflowX: "hidden", pb: isMobile && mode === 'builder' ? "72px" : 0, display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        {isMobile ? (
          <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6" fontWeight={800} noWrap sx={{ width: "100%", fontSize: "clamp(0.95rem, 5vw, 1.25rem)" }}>
              Dust 1947 – Army Builder
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              fullWidth
              onChange={(e, newMode) => newMode && setMode(newMode)}
              size="small"
            >
              <ToggleButton value="builder" sx={{ color: 'white', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Build sx={{ mr: 0.5 }} fontSize="small" />
                Army Builder
              </ToggleButton>
              <ToggleButton value="admin" sx={{ color: 'white', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Settings sx={{ mr: 0.5 }} fontSize="small" />
                Admin
              </ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1} sx={{ width: "100%", flexWrap: "wrap", alignItems: "center", "&:empty": { display: "none" } }} />
          </Box>
        ) : (
        <Toolbar>
          <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
            Dust 1947 – Army Builder
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, newMode) => newMode && setMode(newMode)}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="builder" sx={{ color: 'white', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <Build sx={{ mr: 0.5 }} fontSize="small" />
              Army Builder
            </ToggleButton>
            <ToggleButton value="admin" sx={{ color: 'white', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <Settings sx={{ mr: 0.5 }} fontSize="small" />
              Admin
            </ToggleButton>
          </ToggleButtonGroup>

          {armyDetail && mode === 'builder' && (
            <Chip
              label={`${pointsUsed}/${pointsLimit} Punkte`}
              color={pointsUsed > pointsLimit ? "error" : "default"}
            />
          )}
        </Toolbar>
        )}
      </AppBar>

      {/* Admin Panel Mode */}
      {mode === 'admin' && <AdminPanel />}

      {/* Army Builder Mode */}
      {mode === 'builder' && (
        <>
          <Box sx={{ p: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1.5fr 1fr" : "1fr",
            gap: 1,
          }}
        >
          <ColumnPaper
            title="Armeen"
            mobile={isMobile}
            hidden={isMobile && activePane !== 'armies'}
            action={
              <Button size="small" variant="contained" onClick={() => {setArmyFormArmy(null); setArmyFormOpen(true);}}>
                Neue Armee
              </Button>
            }
          >
            <Stack spacing={1} sx={{ mb: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="game-system-filter-label">Game System</InputLabel>
                <Select
                  labelId="game-system-filter-label"
                  label="Game System"
                  value={selectedGameSystemId}
                  onChange={(event) => {
                    // A bloc is scoped to its game system. Clear it in the
                    // same update as the system switch so it is never
                    // rendered against the new option list.
                    setSelectedBlocFilterId("");
                    setSelectedGameSystemId(event.target.value);
                  }}
                >
                  <MenuItem value="">All Game Systems</MenuItem>
                  {filterGameSystems.map((system) => (
                    <MenuItem key={system.id} value={String(system.id)}>
                      {system.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel id="bloc-filter-label">Bloc</InputLabel>
                <Select
                  labelId="bloc-filter-label"
                  label="Bloc"
                  value={normalizedSelectedBlocFilterId}
                  onChange={(event) => setSelectedBlocFilterId(event.target.value)}
                >
                  <MenuItem value="">All Blocs</MenuItem>
                  {filterBlocs.map((bloc) => (
                    <MenuItem key={bloc.id} value={String(bloc.id)}>
                      {bloc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {loadingArmies ? (
              <CircularProgress />
            ) : (
              <List dense>
				{visibleArmies.map((a) => {
                  const isSelected = String(a.id) === String(selectedArmyId);
                  // For the currently selected army, show the same effective
                  // (bonus-inclusive) limit as the header/alerts instead of
                  // the raw base limit, so the numbers never disagree.
                  const secondaryLimit = isSelected && armyValidation
                    ? `${armyValidation.pointsUsed}/${armyValidation.effectivePointsLimit}`
                    : `${a.points_current}/${a.points_limit}`;
                  return (
                    <ListItem
                      key={a.id}
                      disablePadding
                      sx={{ display: "flex", alignItems: "stretch", bgcolor: isSelected ? "action.selected" : undefined }}
                    >
                      <ListItemButton
                        selected={isSelected}
                        sx={{ flex: 1, minWidth: 0, "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "transparent" } }}
                        onClick={() => { setSelectedArmyId(a.id); if (isMobile) setActivePane('builder'); }}
                      >
                        <ListItemText
                          sx={{ minWidth: 0, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word" }}
                          primaryTypographyProps={{ noWrap: false, sx: { whiteSpace: "normal", overflowWrap: "anywhere" } }}
                          secondaryTypographyProps={{ noWrap: false, sx: { whiteSpace: "normal", overflowWrap: "anywhere" } }}
                          primary={a.name}
                          secondary={`${secondaryLimit} Punkte • ${a.bloc_name}${blocGameSystemById[a.bloc_id] ? ` (${blocGameSystemById[a.bloc_id]})` : ""}`}
                        />
                      </ListItemButton>
                      <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 0.5, pr: 1 }}>
                          <Tooltip title={pdfProgress?.armyId === a.id ? `Erzeuge PDF… ${pdfProgress.done}/${pdfProgress.total}` : "Armeekarten als PDF exportieren"}>
                            <span>
                              <IconButton size="small" aria-label="Armeekarten als PDF exportieren" disabled={pdfProgress !== null} onClick={(e) => { e.stopPropagation(); handleExportArmyPdf(a.id); }}>
                                {pdfProgress?.armyId === a.id
                                  ? <CircularProgress size={20} variant={pdfProgress.total ? "determinate" : "indeterminate"} value={pdfProgress.total ? (100 * pdfProgress.done) / pdfProgress.total : 0} />
                                  : <PictureAsPdf fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Armee clonen">
                            <IconButton size="small" aria-label="Armee clonen" onClick={(e) => { e.stopPropagation(); handleCloneArmy(a.id); }}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Armee bearbeiten">
                            <IconButton size="small" aria-label="Armee bearbeiten" onClick={(e) => { e.stopPropagation(); setArmyFormArmy(isSelected ? (armyDetail?.army || armyDetail || a) : a); setArmyFormOpen(true); }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Armee löschen">
                            <IconButton size="small" color="error" aria-label="Armee löschen" onClick={(e) => { e.stopPropagation(); setConfirmDeleteArmyId(a.id); }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </ColumnPaper>

          <ColumnPaper
            mobile={isMobile}
            hidden={isMobile && activePane !== 'builder'}
            title={
              armyDetail
                ? `Armee: ${armyName} (${blocName}${gameSystemName ? ` • ${gameSystemName}` : ""})`
                : "Armee"
            }
          >
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
			  <Typography fontWeight={700}>Platoons</Typography>
			  <Tooltip title="Platoon hinzufügen">
			    <IconButton size="small" aria-label="Platoon hinzufügen" onClick={() => setAddPlatoonOpen(true)}>
			      <Add fontSize="small" />
			    </IconButton>
			  </Tooltip>
			</Box>

      {armyValidation && (
        <Stack spacing={1} sx={{ mt: 2, mb: 2 }}>
        <Alert severity={armyValidation.isValid ? "success" : "error"}>
          <strong>{armyValidation.forceType}</strong>
          {` • ${armyValidation.pointsUsed}/${armyValidation.effectivePointsLimit} AP`}
          {armyValidation.bonusApAvailable > 0 &&
          ` • Bonus: ${armyValidation.bonusApUsed}/${armyValidation.bonusApAvailable} AP`}
        </Alert>

        {armyValidation.violations.map((entry, index) => (
          <Alert key={`violation-${entry.rule}-${index}`} severity="error" variant="outlined">
          Regel {entry.rule}: {entry.message}
          </Alert>
        ))}

        {armyValidation.warnings.map((entry, index) => (
          <Alert key={`warning-${entry.rule}-${index}`} severity="warning" variant="outlined">
          Regel {entry.rule}: {entry.message}
          </Alert>
        ))}
        </Stack>
      )}

			{armyDetail?.platoons?.map((p) => {
			  
			  const rawSlots = platoonSlots[p.platoon_id] || [];
			  const slots = groupSlots(rawSlots);
			  const platoonUnits = armyDetail.units.filter((u) => u.army_platoon_id === p.army_platoon_id);
			  const supportUnitGroups = aggregateArmyUnits(
          platoonUnits.filter((u) => u.platoon_unit_id === null)
        );

			  return (
				<Box
				  key={p.army_platoon_id}
				  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1, mb: 2 }}
				>
				  <Stack direction="row" justifyContent="space-between">
					<Typography fontWeight={600}>{p.name}</Typography>
					<Button
					  size="small"
					  color="error"
					  onClick={() => handleRemovePlatoon(p.army_platoon_id)}
					>
					  Entfernen
					</Button>
				  </Stack> 
					<Stack spacing={1} sx={{ mt: 1 }}>
					  {slots.map(({ slot, units }) => {
						const assignedUnit = platoonUnits.find(
						  (u) => u.platoon_slot === slot
						);
            const assignedGroup = assignedUnit
              ? aggregateArmyUnits(platoonUnits.filter((u) => u.platoon_slot === slot))[0]
              : null;

						return (
						  <Box
							key={`${p.army_platoon_id}-${slot}`}
							sx={{
							  border: "1px dashed",
							  borderColor: "divider",
							  borderRadius: 1,
							  p: 1,
							}}
						  >
							{/* SLOT BUTTON */}
							<Button
							  size="small"
							  fullWidth
							  variant={assignedUnit ? "outlined" : "contained"}
							  disabled={!!assignedUnit}
							  onClick={() =>
								openAddPlatoonUnit({
								  armyPlatoonId: p.army_platoon_id,
								  platoonUnitId: units[0].id,
								  slot,
								  allowedUnits: units,
								})
							  }
							>
							  {slot} {assignedUnit ? "(belegt)" : ""}
							</Button>

							{assignedGroup && (
  <List dense sx={{ mt: 1 }}>
    {renderUnitGroupRow(assignedGroup)}
  </List>
)}


						  </Box>
						);
					  })}
					</Stack>
					
					{/* SUPPORT BUTTON */}
					<Button
  size="small"
  variant="outlined"
  fullWidth
  sx={{ mt: 1 }}
  onClick={async () => {
    const units = await loadFreeUnits();
    openAddPlatoonUnit({
      armyPlatoonId: p.army_platoon_id,
      platoonUnitId: null,
      slot: "SUPPORT",
      allowedUnits: units,
    });
  }}
>
  + Support-Einheit hinzufügen
</Button>

<List dense>
  {supportUnitGroups.map((group) => renderUnitGroupRow(group))}
</List>


				</Box>
			  );
			})}
            {loadingArmy ? (
              <CircularProgress />
            ) : (
<Box sx={{ mb: 1 }}>
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <Typography fontWeight={700}>Einheiten</Typography>
    <Tooltip title="Einheit hinzufügen">
      <IconButton size="small" aria-label="Einheit hinzufügen" onClick={openAddFreeUnit}>
        <Add fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>

  <List dense>
    {freeUnitGroups.map((group) =>     renderUnitGroupRow(group))}
  </List>
</Box>
            )}
          </ColumnPaper>

			<ColumnPaper title="Details" mobile={isMobile} hidden={isMobile && activePane !== 'details'}>
			    {selectedUnitId ? (
					<UnitCard unitId={selectedUnitId} onBack={() => setSelectedUnitId(null)} />
			  ) : (
				<Typography color="text.secondary">
				  Einheit auswählen…
				</Typography>
			  )}
			</ColumnPaper>

        </Box>
      </Box>
      </>
      )}

      {isMobile && mode === 'builder' && (
        <Paper elevation={8} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200 }}>
          <BottomNavigation showLabels value={activePane} onChange={(e, v) => setActivePane(v)}>
            <BottomNavigationAction value="armies" label="Armeen" icon={<ListIcon />} />
            <BottomNavigationAction value="builder" label="Armybuilder" icon={<Groups />} />
            <BottomNavigationAction value="details" label="Details" icon={<Description />} />
          </BottomNavigation>
        </Paper>
      )}

      {/* Dialogs (used in Army Builder mode) */}
	  <ConfirmDialog
		open={confirmDeleteArmyId !== null}
		title="Armee löschen"
		message="Möchtest du diese Armee wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
		confirmText="Löschen"
		onClose={() => setConfirmDeleteArmyId(null)}
		onConfirm={async () => {
			await handleDeleteArmyConfirmed(confirmDeleteArmyId);
			setConfirmDeleteArmyId(null);
		}}
	  />
	  <ArmyFormDialog
		open={armyFormOpen}
		army={armyFormArmy}
		blocs={blocs}
		onClose={() => {
		  setArmyFormOpen(false);
		  setArmyFormArmy(null);
		}}
		onSubmit={handleArmyFormSubmit}
	  />
	  <AddPlatoonDialog
		open={addPlatoonOpen}
		platoons={availablePlatoons}
		onClose={() => setAddPlatoonOpen(false)}
		onAdd={handleAddPlatoon}
	  />
	  <AddUnitDialog
        open={addUnitOpen}
		units={availableUnits}
		onClose={handleCloseAddUnit}
		onAdd={handleAddUnit}
		/>
    </Box>
  );
}
