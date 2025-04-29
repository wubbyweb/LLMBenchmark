const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.mimetype === 'text/html' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only text files are allowed!'), false);
    }
  }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API endpoint for file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded file
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Process the text with OpenAI
    const analysisResult = await analyzeTextWithOpenAI(fileContent);

    // Return the result
    res.json({
      success: true,
      originalText: fileContent,
      processedText: analysisResult
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Function to analyze text with OpenAI
async function analyzeTextWithOpenAI(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a text analysis assistant that generates hierarchical headings for text documents." },
          { role: "user", content: `Please analyze the following text and generate hierarchical headings (level 1 through 5) based on the text structure and content:\n\n${text}` }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to analyze text with OpenAI');
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});