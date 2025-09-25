// src/MapPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { Box, Button, Typography, Card, CardContent, CardMedia, Drawer, TextField, FormGroup, FormControlLabel, Checkbox, Slider, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
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

    // Pass the bounds AND filters to the fetch function
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

// =========================================================================
// Filter Sidebar Component
// =========================================================================
const amenitiesList = ["Gymnasium", "Swimming Pool", "Badminton Court(s)", "Kids' Play Areas / Sand Pits", "CCTV / Video Surveillance", "Power Backup", "24 x 7 Security", "Clubhouse"
  , "Tennis Court(s)", "Squash Court", "Cricket", "Snooker/Pool/Billiards", "Jogging / Cycle Track", "Multipurpose Hall", "Party Lawn", "Amphitheater", "Power Backup", "Skating Rink", "Spa", "ATM's", "Lift", "Intercom Facility", "Conference Room"
  , "Yoga Areas", "Guest House", "Restaurant", "Shopping Center", "Indoor Games", "Burglar Alarm", "Dance Room"
];

const FilterSidebar = ({ onFilterChange, open, onClose }) => {
    const [priceRange, setPriceRange] = useState([100000, 15000000]); // Example range
    const [amenities, setAmenities] = useState({});

    const handleSliderChange = (event, newValue) => {
        setPriceRange(newValue);
    };

    const handleAmenityChange = (event) => {
        setAmenities({
            ...amenities,
            [event.target.name]: event.target.checked,
        });
    };

    const handleApplyFilters = () => {
        const selectedAmenities = Object.keys(amenities).filter(key => amenities[key]);
        const filters = {
            minPrice: priceRange[0] || undefined,
            maxPrice: priceRange[1] || undefined,
            amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
        };
        onFilterChange(filters);
    };

    const formatIndianRupees = (value) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Drawer
            variant="temporary"
            open={open}
            onClose={onClose}
            sx={{
                width: 280,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: 280, boxSizing: 'border-box', top: 0, left: 0, bottom: 0, zIndex: 1000, p: 2, pt: 10 },
            }}
        >
            <Typography variant="h6" gutterBottom>Filters</Typography>

            <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Price Range</Typography>
                <Slider
                    value={priceRange}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    getAriaValueText={formatIndianRupees}
                    valueLabelFormat={formatIndianRupees}
                    min={0}
                    max={25000000} // Set a realistic max price for your data
                    disableSwap
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                        {formatIndianRupees(priceRange[0])}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatIndianRupees(priceRange[1])}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Amenities</Typography>
                <FormGroup>
                    {amenitiesList.map((amenity) => (
                        <FormControlLabel
                            key={amenity}
                            control={
                                <Checkbox
                                    checked={amenities[amenity] || false}
                                    onChange={handleAmenityChange}
                                    name={amenity}
                                />
                            }
                            label={amenity}
                        />
                    ))}
                </FormGroup>
            </Box>

            <Button variant="contained" color="secondary" onClick={handleApplyFilters} fullWidth>
                Apply Filters
            </Button>
        </Drawer>
    );
};

// =========================================================================
// Price Formatting Logic
// =========================================================================
const formatPrice = (price) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString()}`;
};

// =========================================================================
// Apartment List Component
// =========================================================================
const ApartmentList = ({ apartments, loading, activeApartmentId, onListItemClick, listItemsRef }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, height: '100%', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ overflowY: 'auto', p: 1, height: '100%', width: '100%' }}>
      {apartments.length > 0 ? (
        <List sx={{ width: '100%' }}>
          {apartments.map((apartment) => (
            <ListItem
              key={apartment._id}
              ref={el => listItemsRef.current[apartment._id] = el}
              disableGutters
              sx={{
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                cursor: 'pointer',
                backgroundColor: activeApartmentId === apartment._id ? '#e3f2fd' : 'background.paper',
                color: activeApartmentId === apartment._id ? 'primary.main' : 'text.primary',
                width: '100%'
              }}
              onClick={() => onListItemClick(apartment)}
            >
              <ListItemText
                sx={{ p: 1, my: 0 }}
                primary={
                  <Typography variant="h6" component="div">
                    {apartment["Apartment Name"]}
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {`Location: ${apartment.Location}`}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.primary">
                      {`Price: ${formatPrice(apartment["Minimum Price"])} - ${formatPrice(apartment["Maximum Price"])}`}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ p: 2 }}>No apartments found.</Typography>
      )}
    </Box>
  );
};

// =========================================================================
// MAIN COMPONENT: MapPage
// =========================================================================
const MapPage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeApartmentId, setActiveApartmentId] = useState(null); // NEW: State for active apartment
  const markerRefs = useRef({}); // NEW: Ref to hold marker instances
  const listItemsRef = useRef({}); // NEW: Ref for list item elements
  const navigate = useNavigate();

  const fetchApartments = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_APP_API_URL || "https://apartment-backend-yrhi.onrender.com";
      let url = `${API_BASE}/api/apartments`;
      const params = {};
      if (options.bounds) {
        params.north = options.bounds.north;
        params.south = options.bounds.south;
        params.east = options.bounds.east;
        params.west = options.bounds.west;
      }
      if (options.filters) {
        if (options.filters.minPrice) params.minPrice = options.filters.minPrice;
        if (options.filters.maxPrice) params.maxPrice = options.filters.maxPrice;
        if (options.filters.amenities) params.amenities = options.filters.amenities;
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
    // Initial fetch on component mount
    fetchApartments({ filters: filters });
  }, [fetchApartments, filters]);

  useEffect(() => {
    if (activeApartmentId && listItemsRef.current[activeApartmentId]) {
      listItemsRef.current[activeApartmentId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeApartmentId]);

  const defaultCenter = [12.9629, 77.5775];
  
  const handleViewDetails = (apartment) => {
    const url = `/apartment/${apartment._id}`;
    window.open(url, '_blank');
  };

  const handleListItemClick = (apartment) => {
    setActiveApartmentId(apartment._id);
    const markerRef = markerRefs.current[apartment._id];
    if (markerRef) {
      markerRef.openPopup();
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh', position: 'relative' }}>
      
      {/* Container for the List View on the Left */}
      <Box sx={{ width: 280, flexShrink: 0, height: '100%', overflowY: 'auto', bgcolor: 'grey.100' }}>
        <ApartmentList 
          apartments={apartments} 
          loading={loading} 
          activeApartmentId={activeApartmentId} 
          onListItemClick={handleListItemClick} 
          listItemsRef={listItemsRef}
        />
      </Box>

      {/* Map Container */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        
        {/* Filter Sidebar is now a drawer */}
        <FilterSidebar 
          onFilterChange={setFilters} 
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Button to open/close the sidebar */}
        <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
          <Button variant="contained" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <RefreshButton fetchApartments={(bounds) => fetchApartments({ bounds, filters })} />
          {apartments.map(apt => (
            apt.Latitude && apt.Longitude && typeof apt.Latitude === 'number' && typeof apt.Longitude === 'number' ? (
              <Marker 
                key={apt._id} 
                position={[apt.Latitude, apt.Longitude]}
                eventHandlers={{
                  click: () => setActiveApartmentId(apt._id),
                }}
                ref={el => (markerRefs.current[apt._id] = el)}
              >
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
        </MapContainer>
        
        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3, color: 'text.secondary' }}>
            <Typography>Loading apartment data...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 3, color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MapPage;
