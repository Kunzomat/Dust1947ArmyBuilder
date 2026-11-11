import React, { useEffect, useState, useRef } from "react";
import { Typography, Stack, Button, Box, CircularProgress, Dialog, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
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
  const [zoomWidth, setZoomWidth] = useState(0);
  const openZoom = () => setZoomWidth(2 * (cardRef.current?.offsetWidth || CARD_WIDTH / 2));
  const closeZoom = () => setZoomWidth(0);

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
            cursor: "zoom-in",
          }}
          onClick={openZoom}
        >
          <CardFront details={details} bgColor={bgColor} />
        </Box>
      </Stack>
      <Dialog
        open={zoomWidth > 0}
        onClose={closeZoom}
        maxWidth={false}
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.6)" } } }}
        PaperProps={{ sx: { background: "transparent", boxShadow: "none", overflow: "visible", m: 1 } }}
      >
        <IconButton
          aria-label="Schließen"
          onClick={closeZoom}
          size="small"
          sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, color: "#fff", bgcolor: "rgba(0,0,0,0.6)", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}
        >
          <Close fontSize="small" />
        </IconButton>
        <Box
          data-testid="unit-card-zoom"
          sx={{
            ...getUnitCardFrameStyle(),
            width: `min(${zoomWidth}px, calc(100vw - 16px), calc((100vh - 16px) * ${CARD_WIDTH} / ${CARD_HEIGHT}))`,
            display: "flex",
            background: "#000000",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <CardFront details={details} bgColor={bgColor} />
        </Box>
      </Dialog>
    </Box>
  );
}

export default UnitCard;
