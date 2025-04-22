const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
    process.exit(1);
  });

// Define MongoDB Schema and Model
const comicSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  complexityLevel: { type: String, required: true },
  comicStyle: { type: String, required: true },
  pages: [{
    imageUrl: String,
    keyPoints: [String]
  }],
  createdAt: { type: Date, default: Date.now }
});

const Comic = mongoose.model('Comic', comicSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data generation function (fallback if no data in DB)
const generateMockComicData = (topic, complexityLevel, comicStyle) => {
  // Mock image URLs (in a real app, these would be generated or fetched)
  const pages = [
    {
      imageUrl: 'https://via.placeholder.com/800x600?text=Comic+Page+1',
      keyPoints: [
        'Introduction to ' + topic,
        'Basic concepts explained',
        'First principles of ' + topic + ' at ' + complexityLevel + ' level'
      ]
    },
    {
      imageUrl: 'https://via.placeholder.com/800x600?text=Comic+Page+2',
      keyPoints: [
        'Advanced concepts of ' + topic,
        'Key theories explained',
        'Important formulas and ideas'
      ]
    },
    {
      imageUrl: 'https://via.placeholder.com/800x600?text=Comic+Page+3',
      keyPoints: [
        'Practical applications of ' + topic,
        'Real-world examples',
        'Summary of key learnings'
      ]
    }
  ];

  return {
    topic,
    complexityLevel,
    comicStyle,
    pages
  };
};

// Routes
app.post('/api/generate-comic', async (req, res) => {
  const { topic, complexityLevel, comicStyle } = req.body;
  
  if (!topic || !complexityLevel || !comicStyle) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Check if we already have a comic with the same parameters
    let comicData = await Comic.findOne({ 
      topic: { $regex: new RegExp(topic, 'i') },
      complexityLevel,
      comicStyle
    });
    
    // If not found, generate mock data and save to MongoDB
    if (!comicData) {
      const mockComicData = generateMockComicData(topic, complexityLevel, comicStyle);
      comicData = new Comic(mockComicData);
      await comicData.save();
      console.log('Created new comic data for:', topic);
    } else {
      console.log('Found existing comic data for:', topic);
    }
    
    res.json(comicData);
  } catch (err) {
    console.error('Error handling comic generation:', err);
    res.status(500).json({ error: 'Failed to generate comic' });
  }
});

// Get all comics route
app.get('/api/comics', async (req, res) => {
  try {
    const comics = await Comic.find().sort({ createdAt: -1 });
    res.json(comics);
  } catch (err) {
    console.error('Error fetching comics:', err);
    res.status(500).json({ error: 'Failed to fetch comics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 