// src/App.jsx
import React from 'react';
import MapPage from './MapPage';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';

function App() {
  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Apartment Finder
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapPage />
      </Box>
    </Box>
  );
}

export default App;
