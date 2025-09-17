// server.js
// Load environment variables from .env file
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB using the URI from the .env file
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("MONGO_URI is not defined in the .env file!");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the Apartment Schema
const apartmentSchema = new mongoose.Schema({
  "Apartment Name": String,
  "Location": String,
  "Minimum Price": Number,
  "Maximum Price": Number,
  "Per Sqft Cost": mongoose.Schema.Types.Mixed,
  "Number of Units": mongoose.Schema.Types.Mixed,
  "Total Area": String,
  "Photo URL": String,
  "Listing URL": String,
  "Amenities": [String],
  "Latitude": Number,
  "Longitude": Number,
});

const Apartment = mongoose.model("Apartment", apartmentSchema, "apartment");


app.get("/api/apartments", async (req, res) => {
  try {
    const { north, south, east, west, minPrice, maxPrice, amenities } = req.query;
    const query = {};

    if (north && south && east && west) {
      query.Latitude = { $gte: parseFloat(south), $lte: parseFloat(north) };
      query.Longitude = { $gte: parseFloat(west), $lte: parseFloat(east) };
    }
    
    if (minPrice !== undefined && maxPrice !== undefined) {
      query.$or = [
        { "Minimum Price": { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } },
        { "Maximum Price": { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } },
        { "Minimum Price": { $lte: parseFloat(minPrice) }, "Maximum Price": { $gte: parseFloat(maxPrice) } }
      ];
    }

    if (amenities) {
      const amenitiesArray = amenities.split(',').map(amenity => amenity.trim());
      query.Amenities = { $all: amenitiesArray };
    }

    const apartments = await Apartment.find(query).limit(100);
    res.json(apartments);
  } catch (error) {
    console.error("Error fetching apartments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/apartments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apartment = await Apartment.findById(id);

    if (!apartment) {
      return res.status(404).json({ error: "Apartment not found" });
    }

    res.json(apartment);
  } catch (error) {
    console.error("Error fetching single apartment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
