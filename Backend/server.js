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

// API endpoint to fetch apartments
app.get("/api/apartments", async (req, res) => {
  try {
    const { north, south, east, west } = req.query;
    const query = {};

    if (north && south && east && west) {
      query.Latitude = { $gte: parseFloat(south), $lte: parseFloat(north) };
      query.Longitude = { $gte: parseFloat(west), $lte: parseFloat(east) };
    }
    
    const apartments = await Apartment.find(query).limit(100);
    res.json(apartments);
  } catch (error) {
    console.error("Error fetching apartments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
