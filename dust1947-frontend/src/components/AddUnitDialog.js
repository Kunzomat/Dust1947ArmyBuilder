import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
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
} from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

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
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (!open) return;
    setSelectedFaction("");
    setSelectedType("");
    setQuantities({});
  }, [open]);

  function getQuantity(key) {
    return quantities[key] ?? 1;
  }

  function setQuantity(key, value) {
    const qty = Math.max(1, Number(value) || 1);
    setQuantities((prev) => ({ ...prev, [key]: qty }));
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
            const key = u.id || u.unit_id;
            const quantity = getQuantity(key);

            return (
              <ListItem
                key={key}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="small"
                      aria-label="Menge verringern"
                      onClick={() => setQuantity(key, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      size="small"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(key, e.target.value)}
                      inputProps={{ min: 1, style: { width: 36, textAlign: "center" } }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Menge erhöhen"
                      onClick={() => setQuantity(key, quantity + 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ ml: 1 }}
                      onClick={() => onAdd(u, quantity)}
                    >
                      Hinzufügen
                    </Button>
                  </Stack>
                }
              >
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
                  sx={{ pr: 20 }}
                />
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

      <Button onClick={onClose}>Abbrechen</Button>
    </Dialog>
  );
}
