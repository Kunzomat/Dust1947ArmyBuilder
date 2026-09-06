import React, { useEffect, useState, useRef } from "react";
import { Paper, Typography, Button, Box, CircularProgress } from "@mui/material";
import html2canvas from "html2canvas";
import CardBack from "./CardBack";
import CardFront from "./CardFront"; // ✅ neu
import { apiCall } from "../apiClient";

function UnitCard({ unitId, onBack }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef();

	useEffect(() => {
	  if (!unitId) return;

	  let cancelled = false;
	  setLoading(true);

	  async function load() {
		try {
		  const res = await apiCall("unit.get", { id: unitId });

		  if (!cancelled) {
			setDetails(res.unit); // ← passt exakt zur API
		  }
		} catch (err) {
		  console.error(err);
		} finally {
		  if (!cancelled) {
			setLoading(false);
		  }
		}
	  }

	  load();

	  return () => {
		cancelled = true;
	  };
	}, [unitId]);

	const handleExportImage = async () => {
	  if (!details || !cardRef.current) return;

	  // Warten, bis alle Bilder vollständig geladen sind
	  const images = cardRef.current.querySelectorAll("img");
	  await Promise.all(
		Array.from(images).map(
		  (img) =>
			new Promise((resolve) => {
			  if (img.complete) resolve();
			  else img.onload = img.onerror = resolve;
			})
		)
	  );

	  const canvas = await html2canvas(cardRef.current, {
		useCORS: true,                 // 🔧 wichtig für externe/public Bilder
		allowTaint: false,
		backgroundColor: null,         // 🔧 erhält transparente / farbige Hintergründe
		width: 999,
		height: 676,
		scale: 2,                      // 🔧 doppelte Auflösung = gestochen scharf
		logging: false,
	  });

	  const imgData = canvas.toDataURL("image/png");
	  const win = window.open();
	  win.document.write(`
		<title>${details.name}</title>
		<img src="${imgData}" width="999" height="676" style="border-radius:12px;"/>
	  `);
	};

  if (loading) return <CircularProgress sx={{ m: 5 }} />;
  if (!details) return <Typography>Keine Details verfügbar</Typography>;

  // 🎨 Fraktionsfarben dynamisch nach ID
  const factionColorsById = {
    1: "#3f6fb5", // Allies
    2: "#FF4500", // Axis
    3: "#FFB90F", // SSU
    4: "#4a7845", // Mercenaries
    5: "#744d96", // Mythos
  };

  const bgColor = factionColorsById[details.faction_id] || "#3f6fb5";

  return (
    <Paper sx={{ p: 3 }}>
      <Button onClick={onBack} sx={{ mb: 2 }}>
        ← Zurück
      </Button>

      <Box
        ref={cardRef}
        sx={{
          width: "999px",
          height: "676px",
          display: "flex",
          background: bgColor,
          border: "1px solid #000000",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* ==================== VORDERSEITE (links) ==================== */}
        <CardFront details={details} bgColor={bgColor} />

        {/* ==================== RÜCKSEITE (rechts) ==================== */}
		<CardBack
		  weapons={details.weapons}
		  faction={details.faction}
		  points={details.points}
		  bgColor={bgColor}
		  unitName={details.name}
		  specialRules={details.special_rules}
		  type={details.type}
		  level={details.level}
		  speed={details.speed}
		  health={details.health}
		  marchSpeed={details.march_speed}
		/>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleExportImage}>
          Als Image generieren
        </Button>
      </Box>
    </Paper>
  );
}

export default UnitCard;
