import React, { useEffect, useState } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  CircularProgress
} from "@mui/material";

import { apiCall } from "../apiClient";

function UnitList({ onSelect }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiCall("unit.list");
        setUnits(res.units);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <CircularProgress sx={{ m: 5 }} />;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Einheiten
      </Typography>
      <List>
        {units.map(unit => (
          <ListItemButton
            key={unit.id}
            onClick={() => onSelect(unit.id)}
          >
            <ListItemText
              primary={unit.name}
              secondary={unit.faction}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}

export default UnitList;
