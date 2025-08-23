// src/MapPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { Box, Button, Typography } from '@mui/material';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Use environment variable for backend URL
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const RefreshButton = ({ fetchApartments }) => {
  const map = useMap();

  const handleRefresh = () => {
    const bounds = map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();


    fetchApartments({ north, south, east, west });
  };

  return (
    <Box 
      sx={{ 
        position: 'absolute', 
        top: 10, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000 
      }}>
      <Button variant="contained" color="primary" onClick={handleRefresh}>
        Search this area
      </Button>
    </Box>
  );
};

const MapPage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApartments = useCallback(async (bounds = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/apartments`;
      if (bounds) {
        url += `?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`;
      }
      const response = await axios.get(url);
      setApartments(response.data);
    } catch (err) {
      console.error('Error fetching apartments:', err);
      setError("Failed to fetch data. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const defaultCenter = [12.9629, 77.5775];

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
                {apt["Apartment Name"]}
              </Popup>
            </Marker>
          ) : null
        ))}
        {/* Render the refresh button on top of the map */}
        <RefreshButton fetchApartments={fetchApartments} />
      </MapContainer>
      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3, color: 'rgba(0, 0, 0, 0.87)' }}>
          <Typography>Loading apartment data...</Typography>
        </Box>
      )}
      {error && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3, color: 'rgba(229, 19, 19, 0.87)' }}>
          <Typography color="error.main">{error}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapPage;
