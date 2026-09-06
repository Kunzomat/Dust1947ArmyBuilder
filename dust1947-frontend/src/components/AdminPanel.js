import React, { useState } from 'react';
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

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPanel() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          ⚙️ Admin Panel - Daten Verwaltung
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Verwalte alle Basis-Daten: Game Systems, Blocs, Fraktionen, Einheiten, Waffen, Regeln und Platoons
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
      </Paper>
    </Container>
  );
}

