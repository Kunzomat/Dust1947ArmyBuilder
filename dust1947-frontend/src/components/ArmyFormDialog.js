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

export default function ArmyFormDialog({
  open,
  army,          // null = create | object = edit
  blocs,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(army);

  const [name, setName] = useState("");
  const [blocId, setBlocId] = useState("");
  const [pointsLimit, setPointsLimit] = useState(100);

  useEffect(() => {
    if (open) {
      setName(army?.name || "");
      setBlocId(army?.bloc_id || "");
      setPointsLimit(Number(army?.points_limit || 100));
    }
  }, [open, army]);

  const canSubmit = name && blocId && pointsLimit > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? "Armee bearbeiten" : "Neue Armee erstellen"}
      </DialogTitle>

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
			  label="Bloc"
			  value={blocId}
			  onChange={(e) => setBlocId(e.target.value)}
			  fullWidth
			  disabled={isEdit}
			  helperText={isEdit ? "Der Bloc kann nach dem Erstellen nicht mehr geändert werden" : ""}
			>
			  {blocs.map((b) => {
				const isDuplicateName = blocs.filter((x) => x.name === b.name).length > 1;
				return (
				<MenuItem key={b.id} value={b.id}>
				  {isDuplicateName && b.game_system_name ? `${b.name} (${b.game_system_name})` : b.name}
				</MenuItem>
				);
			  })}
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
            onSubmit({
              ...(isEdit && { id: army.id }),
              name,
			  ...( !isEdit && { bloc_id: Number(blocId) } ),
              points_limit: Number(pointsLimit),
            })
          }
        >
          {isEdit ? "Speichern" : "Erstellen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
