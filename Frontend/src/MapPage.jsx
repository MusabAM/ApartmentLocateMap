// src/MapPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { Box, Button, Typography, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A component to place the refresh button on the map
const RefreshButton = ({ fetchApartments }) => {
  const map = useMap(); // Get the map instance

  const handleRefresh = () => {
    // Get the current map bounds
    const bounds = map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Pass the bounds to the fetch function
    fetchApartments({ north, south, east, west });
  };

  return (
    <Box 
      sx={{ 
        position: 'absolute', 
        top: 20, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000,
        boxShadow: 3,
        borderRadius: 2
      }}>
      <Button variant="contained" color="primary" onClick={handleRefresh} size="large" sx={{ borderRadius: 'inherit' }}>
        Search this area
      </Button>
    </Box>
  );
};

const MapPage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchApartments = useCallback(async (bounds = null) => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_APP_API_URL || "https://apartment-backend-yrhi.onrender.com";
      let url = `${API_BASE}/api/apartments`;
      const params = {};
      if (bounds) {
        params.north = bounds.north;
        params.south = bounds.south;
        params.east = bounds.east;
        params.west = bounds.west;
      }

      const response = await axios.get(url, { params });
      setApartments(response.data);
    } catch (err) {
      console.error('Error fetching apartments:', err);
      setError("Failed to fetch data. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch of all apartments on component mount
    fetchApartments();
  }, [fetchApartments]);

  const defaultCenter = [12.9629, 77.5775];
  
  const handleViewDetails = (apartment) => {
    const url = `/apartment/${apartment._id}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {apartments.map(apt => (
          apt.Latitude && apt.Longitude && typeof apt.Latitude === 'number' && typeof apt.Longitude === 'number' ? (
            <Marker key={apt._id} position={[apt.Latitude, apt.Longitude]}>
              <Popup>
                <Card sx={{ maxWidth: 300 }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={apt["Photo URL"]}
                    alt={apt["Apartment Name"]}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {apt["Apartment Name"]}
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => handleViewDetails(apt)}
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ) : null
        ))}
        {/* Render the refresh button on top of the map */}
        <RefreshButton fetchApartments={fetchApartments} />
      </MapContainer>
      
      {/* Aesthetic loading and error messages */}
      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3 }}>
          <Typography>Loading apartment data...</Typography>
        </Box>
      )}
      {error && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3, color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapPage;
