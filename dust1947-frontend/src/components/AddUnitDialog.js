import {
  Dialog, DialogTitle, DialogContent,
  List, ListItemButton, ListItemText, Button
} from "@mui/material";

export default function AddUnitDialog({
  open,
  units,
  onClose,
  onAdd
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Einheit hinzufügen</DialogTitle>

      <DialogContent>
        <List>
          {units.map(u => (
            <ListItemButton key={u.id} onClick={() => onAdd(u)}>
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
				  secondary={`${u.points || u.unit_points} Punkte`}
				/>
            </ListItemButton>
          ))}
        </List>
      </DialogContent>

      <Button onClick={onClose}>Abbrechen</Button>
    </Dialog>
  );
}
