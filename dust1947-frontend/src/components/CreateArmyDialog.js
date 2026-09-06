import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function CreateArmyDialog({
  open,
  factions,
  onClose,
  onCreate,
}) {
  const [name, setName] = useState("");
  const [factionId, setFactionId] = useState("");
  const [pointsLimit, setPointsLimit] = useState(100);

  // Reset wenn Dialog neu geöffnet wird
  useEffect(() => {
    if (open) {
      setName("");
      setFactionId("");
      setPointsLimit(100);
    }
  }, [open]);

  const canSubmit = name && factionId && pointsLimit > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Neue Armee anlegen</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name der Armee"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
          />

          <TextField
            select
            label="Fraktion"
            value={factionId}
            onChange={(e) => setFactionId(e.target.value)}
            fullWidth
          >
            {factions.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Punktelimit"
            type="number"
            value={pointsLimit}
            onChange={(e) => setPointsLimit(Number(e.target.value))}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() =>
            onCreate({
              name,
              faction_id: Number(factionId),
              points_limit: Number(pointsLimit),
            })
          }
        >
          Anlegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
