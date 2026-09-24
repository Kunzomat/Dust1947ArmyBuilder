import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

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
  const [selectedFaction, setSelectedFaction] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedFaction("");
    setSelectedType("");
  }, [open]);

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

  const filteredUnits = useMemo(
    () =>
      (units || []).filter((u) => {
        const unitType = u.type || u.unit_type || "";
        const factionMatch = !selectedFaction || u.faction_name === selectedFaction;
        const typeMatch = !selectedType || String(unitType) === selectedType;
        return factionMatch && typeMatch;
      }),
    [units, selectedFaction, selectedType]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Einheit hinzufügen</DialogTitle>

      <DialogContent>
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

            return (
              <ListItemButton key={u.id || u.unit_id} onClick={() => onAdd(u)}>
                <ListItemText
                  primary={
                    <>
                      {u.name || u.unit_name}
                      {u.faction_name && (
                        <span style={{ color: "#666", marginLeft: 6 }}>
                          ({u.faction_name})
                        </span>
                      )}
                    </>
                  }
                  secondary={`${typeLabel} • ${points ?? "undefined"} Punkte`}
                />
              </ListItemButton>
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

      <Button onClick={onClose}>Abbrechen</Button>
    </Dialog>
  );
}
