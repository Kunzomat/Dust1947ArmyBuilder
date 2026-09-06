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
} from "@mui/material";
import { Settings, Build } from "@mui/icons-material";
import ConfirmDialog from "./components/ConfirmDialog";
import ArmyFormDialog from "./components/ArmyFormDialog";
import AddPlatoonDialog from "./components/AddPlatoonDialog";
import AddUnitDialog from "./components/AddUnitDialog";
import UnitCard from "./components/UnitCard";
import AdminPanel from "./components/AdminPanel";
import { getImageUrl, getPlaceholderImage } from "./imageHelper";

function ColumnPaper({ title, children, sx }) {
  return (
    <Paper
      elevation={2}
      sx={{
        height: "calc(100vh - 64px - 16px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 1.5, overflow: "auto", flex: 1 }}>{children}</Box>
    </Paper>
  );
}

function groupByPlatoon(units) {
  const groups = new Map();
  for (const u of units || []) {
    const key =
      u.platoon_id === null || u.platoon_id === undefined
        ? "FREE"
        : String(u.platoon_id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  return groups;
}

export default function App() {
  const isDesktop = useMemo(
    () => window.matchMedia("(min-width: 900px)").matches,
    []
  );

  // Mode: 'builder' or 'admin'
  const [mode, setMode] = useState('builder');
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
  const [confirmDeleteArmyId, setConfirmDeleteArmyId] = useState(null);
  
  const [armyFormOpen, setArmyFormOpen] = useState(false);
  const [armyFormArmy, setArmyFormArmy] = useState(null); // null = create

  const [factions, setFactions] = useState([]);
  const [blocs, setBlocs] = useState([]);
  
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

		return (data.units || []).filter((u) => Number(u.bloc_id) === Number(bloc_id));
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
      await apiCall("armies.create", data, "POST");
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
		await loadArmies();
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
  
  async function handleAddPlatoon(platoonId) {
    try {
      await apiCall(
        "army.platoons.add",
        { army_id: selectedArmyId, platoon_id: platoonId },
        "POST"
      );
      setAddPlatoonOpen(false);
      await loadArmy(selectedArmyId);
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
      await loadArmy(selectedArmyId);
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


	async function handleAddUnit(unit) {
	  const payload = {
		army_id: selectedArmyId,
		unit_id: unit.unit_id || unit.id,
		quantity: 1,
	  };

	  if (addUnitContext?.army_platoon_id) {
		payload.army_platoon_id = addUnitContext.army_platoon_id;

		if (Number.isInteger(addUnitContext.platoon_unit_id)) {
		  payload.platoon_unit_id = addUnitContext.platoon_unit_id;
		}
		// else → Support (NULL, korrekt)
	  }

	  console.log("ADD UNIT PAYLOAD", payload); // 🔍 Debug – sehr empfehlenswert

	  await apiCall("army.units.add", payload, "POST");

	  setAddUnitOpen(false);
	  setAddUnitContext(null);
	  await loadArmy(selectedArmyId);
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
  useEffect(() => { loadArmies(); loadFactions(); loadBlocs();}, []);
  useEffect(() => { if (!addPlatoonOpen || !armyDetail) return; loadAvailablePlatoons(armyDetail.army.bloc_id);}, [addPlatoonOpen, armyDetail]);
  useEffect(() => { if (!armyDetail?.platoons) return; armyDetail.platoons.forEach((p) => {loadPlatoonSlots(p.platoon_id);});}, [armyDetail]);

  
	const rosterUnits = useMemo(() => {
		if (!armyDetail) return [];
		return (armyDetail.units || []).map((u) => ({
			...u,
			name: u.unit_name,
			points: u.unit_points,
		}));
	}, [armyDetail]);

	const grouped = useMemo(() => groupByPlatoon(rosterUnits), [rosterUnits]);
	const freeUnits = useMemo(() => {
		if (!armyDetail) return [];
		return armyDetail.units.filter(
			(u) => u.army_platoon_id === null
		);
	}, [armyDetail]);
	
	const pointsUsed = armyDetail?.army?.points_current ?? 0;
	const pointsLimit = armyDetail?.army?.points_limit ?? 0;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
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
          <ColumnPaper title="Armeen">
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={loadArmies}>
                Aktualisieren
              </Button>
			  <Button size="small" variant="contained" onClick={() => {setArmyFormArmy(null); setArmyFormOpen(true);}}>
				Neue Armee
			  </Button>
              {selectedArmyId && (
				<Button size="small" color="error" variant="outlined" onClick={() => setConfirmDeleteArmyId(selectedArmyId)}>Löschen</Button>
              )}
            </Stack>

            {loadingArmies ? (
              <CircularProgress />
            ) : (
              <List dense>
                {armies.map((a) => (
                  <ListItemButton
                    key={a.id}
                    selected={String(a.id) === String(selectedArmyId)}
                    onClick={() => setSelectedArmyId(a.id)}
                  >
                    <ListItemText
                      primary={a.name}					  
                      secondary={`${a.points_current}/${a.points_limit} Punkte • ${a.bloc_name}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </ColumnPaper>

          <ColumnPaper title={`Armee: ${armyName} (${blocName})`}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
			  <Button size="small" variant="outlined" onClick={() => { setArmyFormArmy(armyDetail?.army || armyDetail); setArmyFormOpen(true); }}>
				Bearbeiten
			  </Button>
			  <Button size="small" variant="outlined" onClick={() => setAddPlatoonOpen(true)}>
			    Platoon hinzufügen
			  </Button>
			  <Button size="small" variant="outlined" onClick={openAddFreeUnit} >
				Einheit hinzufügen
			  </Button>
            </Stack>
			
			<Typography fontWeight={700} sx={{ mt: 2 }}>
			  Platoons
			</Typography>

			{armyDetail?.platoons?.map((p) => {
			  
			  const rawSlots = platoonSlots[p.platoon_id] || [];
			  const slots = groupSlots(rawSlots);
			  const platoonUnits = armyDetail.units.filter((u) => u.army_platoon_id === p.army_platoon_id);
			  const supportUnits = platoonUnits.filter((u) => u.platoon_unit_id === null);

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

							{assignedUnit && (
  <List dense sx={{ mt: 1 }}>
    <ListItem
      disablePadding
      secondaryAction={
        <Button
          size="small"
          color="error"
          onClick={async (e) => {
            e.stopPropagation(); // 🔥 sonst würde Auswahl toggeln
            await apiCall(
              "army.units.delete",
              { id: assignedUnit.army_unit_id },
              "POST"
            );
            await loadArmy(selectedArmyId);

            if (selectedArmyUnitId === assignedUnit.army_unit_id) {
              setSelectedArmyUnitId(null);
              setSelectedUnitId(null);
            }
          }}
        >
          Entfernen
        </Button>
      }
    >
      <ListItemButton
        selected={selectedArmyUnitId === assignedUnit.army_unit_id}
        onClick={() => {
          setSelectedArmyUnitId(assignedUnit.army_unit_id);
          setSelectedUnitId(assignedUnit.unit_id);
        }}
      >
        <ListItemText
          primary={assignedUnit.unit_name}
          secondary={`${assignedUnit.unit_points} Punkte`}
        />
      </ListItemButton>
    </ListItem>
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
  {supportUnits.map((u) => {
    const selected = selectedArmyUnitId === u.army_unit_id;

    return (
      <ListItem
        key={u.army_unit_id}
        disablePadding
        secondaryAction={
          <Button
            size="small"
            color="error"
            onClick={async (e) => {
              e.stopPropagation(); // 🔥 extrem wichtig
              await apiCall(
                "army.units.delete",
                { id: u.army_unit_id },
                "POST"
              );
              await loadArmy(selectedArmyId);

              if (selected) {
                setSelectedArmyUnitId(null);
                setSelectedUnitId(null);
              }
            }}
          >
            Entfernen
          </Button>
        }
      >
        <ListItemButton
          selected={selected}
          onClick={() => {
            setSelectedArmyUnitId(u.army_unit_id);
            setSelectedUnitId(u.unit_id);
          }}
        >
          <ListItemText
            primary={u.unit_name}
            secondary={`${u.unit_points} Punkte`}
          />
        </ListItemButton>
      </ListItem>
    );
  })}
</List>


				</Box>
			  );
			})}
            {loadingArmy ? (
              <CircularProgress />
            ) : (
              [...grouped.entries()].map(([key, units]) => (
			  
			  
<Box key={key} sx={{ mb: 1 }}>
  <Typography fontWeight={700}>Freie Einheiten</Typography>

  <List dense>
    {freeUnits.map((u) => {
      const selected = u.army_unit_id === selectedArmyUnitId;

      return (
        <ListItem
          key={u.army_unit_id}
          disablePadding
          secondaryAction={
            <Button
              size="small"
              color="error"
              onClick={async (e) => {
                e.stopPropagation(); // 🔥 sonst Auswahl
                await apiCall(
                  "army.units.delete",
                  { id: u.army_unit_id },
                  "POST"
                );
                await loadArmy(selectedArmyId);

                if (selected) {
                  setSelectedArmyUnitId(null);
                  setSelectedUnitId(null);
                }
              }}
            >
              Entfernen
            </Button>
          }
        >
          <ListItemButton
            selected={selected}
            onClick={() => {
              setSelectedArmyUnitId(u.army_unit_id);
              setSelectedUnitId(u.unit_id);
            }}
          >
            <ListItemText
              primary={u.unit_name}
              secondary={`${u.unit_points} Punkte`}
            />
          </ListItemButton>
        </ListItem>
      );
    })}
  </List>
</Box>
			  
			  

              ))
            )}
          </ColumnPaper>

			<ColumnPaper title="Details">
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
		onClose={() => setAddUnitOpen(false)}
		onAdd={handleAddUnit}
		/>
    </Box>
  );
}
