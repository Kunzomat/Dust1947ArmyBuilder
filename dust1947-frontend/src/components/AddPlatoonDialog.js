import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";

export default function AddPlatoonDialog({
  open,
  platoons,
  onClose,
  onAdd,
}) {
  const [platoonId, setPlatoonId] = useState("");

  function handleAdd() {
    if (!platoonId) return;
    onAdd(Number(platoonId));
    setPlatoonId("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Platoon hinzufügen</DialogTitle>

      <DialogContent>
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleAdd}>
          Hinzufügen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
