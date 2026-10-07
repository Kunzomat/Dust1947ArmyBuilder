import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  TextField,
  Alert,
} from "@mui/material";

export default function AddPlatoonDialog({
  open,
  platoons,
  onClose,
  onAdd,
}) {
  const [platoonId, setPlatoonId] = useState("");
  const hasPlatoons = Boolean(platoons && platoons.length);

  function handleAdd() {
    if (!platoonId) return;
    onAdd(Number(platoonId));
    setPlatoonId("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Platoon hinzufügen</DialogTitle>

      <DialogContent>
        {hasPlatoons ? (
          <TextField
            select
            fullWidth
            label="Platoon"
            value={platoonId}
            onChange={(e) => setPlatoonId(e.target.value)}
            sx={{ mt: 1 }}
          >
            {platoons.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Für diesen Bloc sind keine Platoon-Vorlagen vorhanden. Du kannst stattdessen
            einzelne Einheiten über "Einheit hinzufügen" zur Armee hinzufügen.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!hasPlatoons}>
          Hinzufügen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
