import React, { useEffect, useState, useRef } from "react";
import { Typography, Stack, Button, Box, CircularProgress } from "@mui/material";
import CardFront from "./CardFront";
import { apiCall } from "../apiClient";
import { CARD_WIDTH, CARD_HEIGHT, getFactionColor, renderCardElementToCanvas } from "../utils/cardExport";

export function getUnitCardFrameStyle() {
  return {
    width: `min(${CARD_WIDTH}px, 100%)`,
    maxWidth: "100%",
    flexShrink: 0,
    aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}`,
    height: "auto",
  };
}

function UnitCard({ unitId }) {
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
          setDetails(res.unit);
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

    const canvas = await renderCardElementToCanvas(cardRef.current);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = String(details.name || "unit").replace(/[^\w-]+/g, "_");
    link.href = url;
    link.download = `${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) return <CircularProgress sx={{ m: 5 }} />;
  if (!details) return <Typography>Keine Details verfügbar</Typography>;

  const bgColor = getFactionColor(details.faction_id);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button size="small" variant="text" onClick={handleExportImage}>
          Karte als Bild exportieren
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Box
          ref={cardRef}
          data-card-export-root="true"
          sx={{
            ...getUnitCardFrameStyle(),
            display: "flex",
            background: "#000000",
            border: "1px solid #000000",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <CardFront details={details} bgColor={bgColor} />
        </Box>
      </Stack>
    </Box>
  );
}

export default UnitCard;
