import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Container
} from '@mui/material';
import FactionManager from './admin/FactionManager';
import UnitManager from './admin/UnitManager';
import WeaponManager from './admin/WeaponManager';
import RuleManager from './admin/RuleManager';
import PlatoonManager from './admin/PlatoonManager';
import BlocManager from './admin/BlocManager';
import GameSystemManager from './admin/GameSystemManager';
import ActionManager from './admin/ActionManager';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ADMIN_TAB_COUNT = 8;

export default function AdminPanel() {
  // Restore last visited Admin tab after a reload (e.g. F5 on Admin -> Units stays on Units).
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('dust1947_admin_tab'), 10);
    return Number.isInteger(saved) && saved >= 0 && saved < ADMIN_TAB_COUNT ? saved : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('dust1947_admin_tab', String(currentTab));
  }, [currentTab]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          ⚙️ Admin Panel - Daten Verwaltung
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Verwalte alle Basis-Daten: Game Systems, Blocs, Fraktionen, Einheiten, Waffen, Regeln, Platoons und Actions
        </Typography>

        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="🎮 Game Systems" />
          <Tab label="🏴 Blocs" />
          <Tab label="🎖️ Factions" />
          <Tab label="⚔️ Units" />
          <Tab label="🔫 Weapons" />
          <Tab label="📜 Rules" />
          <Tab label="🪖 Platoons" />
          <Tab label="Actions" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <GameSystemManager />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <BlocManager />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <FactionManager />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <UnitManager />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <WeaponManager />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <RuleManager />
        </TabPanel>
        <TabPanel value={currentTab} index={6}>
          <PlatoonManager />
        </TabPanel>
        <TabPanel value={currentTab} index={7}>
          <ActionManager />
        </TabPanel>
      </Paper>
    </Container>
  );
}
