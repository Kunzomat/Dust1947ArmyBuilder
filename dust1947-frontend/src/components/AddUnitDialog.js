import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Button,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import useSessionStorageState from "../hooks/useSessionStorageState";

const TYPE_LABELS = {
  I: "Infantry",
  V: "Vehicle",
  A: "Aircraft",
  H: "Hero",
};

export default function AddUnitDialog({
  open,
  units,
  onClose,
  onAdd,
}) {
  const [filters, setFilters] = useSessionStorageState(
    "dust1947.filters.v1.add-unit-dialog",
    { selectedFaction: "", selectedType: "" }
  );
  const { selectedFaction, selectedType } = filters;
  const setSelectedFaction = (value) =>
    setFilters((previous) => ({ ...previous, selectedFaction: value }));
  const setSelectedType = (value) =>
    setFilters((previous) => ({ ...previous, selectedType: value }));
  const [search, setSearch] = useState("");
  const [pendingKeys, setPendingKeys] = useState([]);
  const pendingRef = useRef(new Set());
  const [notice, setNotice] = useState(null); // { severity, message }
  const [noticeOpen, setNoticeOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  async function handleAdd(unit, key) {
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setPendingKeys(Array.from(pendingRef.current));
    const name = unit.name || unit.unit_name || "Einheit";
    let result;
    try {
      result = await onAdd(unit, 1);
    } catch (e) {
      result = { ok: false, message: String(e?.message || e) };
    }
    pendingRef.current.delete(key);
    setPendingKeys(Array.from(pendingRef.current));
    if (result?.ok === false) {
      setNotice({
        severity: "error",
        message: `${name} konnte nicht hinzugefügt werden: ${result.message || "Unbekannter Fehler"}`,
      });
    } else {
      setNotice({ severity: "success", message: `${name} wurde hinzugefügt.` });
    }
    setNoticeOpen(true);
  }

  const factionOptions = useMemo(
    () =>
      Array.from(new Set((units || []).map((u) => u.faction_name).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [units]
  );

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set((units || []).map((u) => u.type || u.unit_type).filter(Boolean))
      ).sort((a, b) => String(a).localeCompare(String(b))),
    [units]
  );

  useEffect(() => {
    if (!open) return;
    if (selectedFaction && !factionOptions.includes(selectedFaction)) {
      setFilters((previous) => ({ ...previous, selectedFaction: "" }));
    }
    if (selectedType && !typeOptions.some((type) => String(type) === String(selectedType))) {
      setFilters((previous) => ({ ...previous, selectedType: "" }));
    }
  }, [factionOptions, open, selectedFaction, setFilters, typeOptions, selectedType]);

  const filteredUnits = useMemo(
    () =>
      (units || []).filter((u) => {
        const unitType = u.type || u.unit_type || "";
        const factionMatch = !selectedFaction || u.faction_name === selectedFaction;
        const typeMatch = !selectedType || String(unitType) === selectedType;
        const term = search.trim().toLowerCase();
        const searchMatch =
          !term || String(u.name || u.unit_name || "").toLowerCase().includes(term);
        return factionMatch && typeMatch && searchMatch;
      }).sort((a, b) =>
        (a.name || a.unit_name || "").localeCompare(
          b.name || b.unit_name || "",
          "de",
          { sensitivity: "base" }
        )
      ),
    [units, selectedFaction, selectedType, search]
  );

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Einheit hinzufügen
        <IconButton
          aria-label="Schließen"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 3 } }}>
        <TextField
          size="small"
          fullWidth
          label="Suche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mt: 1, mb: 1.5 }}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="add-unit-faction-filter-label">Faction</InputLabel>
            <Select
              variant="outlined"
              labelId="add-unit-faction-filter-label"
              value={selectedFaction}
              label="Faction"
              onChange={(e) => setSelectedFaction(e.target.value)}
            >
              <MenuItem value="">Alle Factions</MenuItem>
              {factionOptions.map((factionName) => (
                <MenuItem key={factionName} value={factionName}>
                  {factionName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="add-unit-type-filter-label">Einheitstyp</InputLabel>
            <Select
              variant="outlined"
              labelId="add-unit-type-filter-label"
              value={selectedType}
              label="Einheitstyp"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">Alle Typen</MenuItem>
              {typeOptions.map((typeCode) => (
                <MenuItem key={typeCode} value={String(typeCode)}>
                  {typeCode} - {TYPE_LABELS[typeCode] || typeCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <List>
          {filteredUnits.map((u) => {
            const unitType = u.type || u.unit_type;
            const typeLabel = unitType
              ? `${unitType}${TYPE_LABELS[unitType] ? ` - ${TYPE_LABELS[unitType]}` : ""}`
              : "Kein Typ";
            const points = u.points ?? u.unit_points;
            const key = u.id || u.unit_id;
            const name = u.name || u.unit_name;
            const pending = pendingKeys.includes(key);

            return (
              <ListItem
                key={key}
                divider
                disableGutters
                sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                  >
                    {name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {[u.faction_name, typeLabel].filter(Boolean).join(" • ")}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ flexShrink: 0 }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                    {points ?? "?"} AP
                  </Typography>
                  <Tooltip title="Hinzufügen">
                    <span>
                      <IconButton
                        color="primary"
                        aria-label="Hinzufügen"
                        disabled={pending}
                        onClick={() => handleAdd(u, key)}
                      >
                        <AddIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </ListItem>
            );
          })}
        </List>

        {filteredUnits.length === 0 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Keine Einheiten für die aktuellen Filter gefunden.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={open && noticeOpen}
      autoHideDuration={noticeOpen && notice?.severity === "error" ? 6000 : 2000}
      onClose={(event, reason) => {
        if (reason === "clickaway") return;
        setNoticeOpen(false);
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ zIndex: (t) => t.zIndex.modal + 100 }}
    >
      <Alert
        severity={notice?.severity || "success"}
        variant="filled"
        onClose={() => setNoticeOpen(false)}
        sx={{ width: "100%" }}
      >
        {notice?.message}
      </Alert>
    </Snackbar>
    </>
  );
}
