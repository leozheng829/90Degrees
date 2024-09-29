require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');

// Initialize Express
const app = express();

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a MongoDB model for images
const Image = mongoose.model('Image', new mongoose.Schema({
  url: String,
}));

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

app.post('/upload', upload.single('photo'), async (req, res) => {
  const file = req.file;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const s3Result = await s3.upload(params).promise();
    const imageUrl = s3Result.Location;

    // Save image URL to MongoDB
    const image = new Image({ url: imageUrl });
    await image.save();

    res.json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});