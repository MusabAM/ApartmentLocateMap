// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MapPage from './MapPage';
import ApartmentDetailsPage from './ApartmentDetailsPage';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

const Header = () => {
  const navigate = useNavigate();
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          onClick={() => navigate('/')} 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
        >
          Apartment Finder
        </Typography>
        <Button color="inherit" onClick={() => navigate('/')}>
          Map
        </Button>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/apartment/:id" element={<ApartmentDetailsPage />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
