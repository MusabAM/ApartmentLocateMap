// src/ApartmentDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Card, CardContent, CardMedia, Button, Chip, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ApartmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApartmentDetails = async () => {
      try {
        const API_BASE = import.meta.env.VITE_APP_API_URL || "https://apartment-backend-yrhi.onrender.com";
        const response = await axios.get(`${API_BASE}/api/apartments/${id}`);
        setApartment(response.data);
      } catch (err) {
        console.error('Error fetching apartment details:', err);
        setError("Failed to fetch apartment details. Please check the backend server and ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentDetails();
  }, [id]);
  
  const getCleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const index = url.indexOf('.jpg');
    if (index !== -1) {
      return url.substring(0, index + 4);
    }
    return url;
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading apartment details...</Typography></Box>;
  }

  if (error || !apartment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">{error || "Apartment details not found."}</Typography>
        <Button onClick={() => navigate('/')} variant="contained" sx={{ mt: 2 }}>
          Go back to map
        </Button>
      </Box>
    );
  }

  const formatPrice = (price) => {
    if (price === -1) {
      return "Price on Request";
    }
    const crore = 10000000;
    const lakh = 100000;
    
    if (price >= crore) {
      return `₹${(price / crore).toFixed(2)} CR`;
    } else if (price >= lakh) {
      return `₹${(price / lakh).toFixed(2)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const formattedPriceRange = apartment["Minimum Price"] === -1 
    ? "Price on Request" 
    : `${formatPrice(apartment["Minimum Price"])} - ${formatPrice(apartment["Maximum Price"])}`;

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          onClick={() => navigate(-1)} 
          startIcon={<ArrowBackIcon />} 
          variant="outlined"
        >
          Back to Map
        </Button>
      </Box>
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        {apartment["Photo URL"] && (
          <CardMedia
            component="img"
            height="400"
            image={getCleanImageUrl(apartment["Photo URL"])}
            alt={apartment["Apartment Name"]}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h4" component="div">
            {apartment["Apartment Name"]}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Location:</strong> {apartment.Location}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Price Range:</strong> {formattedPriceRange}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Per Sqft Cost:</strong> {apartment["Per Sqft Cost"]}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Number of Units:</strong> {apartment["Number of Units"]}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Total Area:</strong> {apartment["Total Area"]}
              </Typography>
            </Grid>
          </Grid>
          
          {apartment.Amenities && apartment.Amenities.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Amenities:</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {apartment.Amenities.map((amenity, index) => (
                  <Chip key={index} label={amenity} color="primary" />
                ))}
              </Box>
            </Box>
          )}

          {apartment["Listing URL"] && (
            <Button 
              variant="contained" 
              href={apartment["Listing URL"]} 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              View Listing
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApartmentDetailsPage;
