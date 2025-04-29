const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to ensure JSON responses
app.use(express.json());

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
          { role: "system", content: "You are a text analysis assistant that generates hierarchical headings for text documents. Respond in the following JSON format:\n\n{\n  \"content\": {\n    \"heading\": {\n      \"level\": 1,\n      \"text\": \"Main Heading\",\n     \"content\" : [\n      {\n        \"type\": \"paragraph\",\n        \"text\": \"Some introductory paragraph here.\"\n      },\n      {\n          \"heading\": {\n          \"level\": 2,\n          \"text\": \"Subheading 1\",\n          \"content\": [\n            {\n            \"type\": \"paragraph\",\n            \"text\": \"Content related to Subheading 1.\"\n          },\n          {\n            \"heading\": {\n              \"level\": 3,\n               \"text\": \"Sub-subheading 1.1\",\n               \"content\": [\n                 {\n                    \"type\": \"paragraph\",\n                     \"text\": \"Content for sub-subheading 1.1\"\n                   }\n                ]\n            }\n           },\n           {\n             \"heading\": {\n              \"level\": 3,\n              \"text\": \"Sub-subheading 1.2\",\n              \"content\": [\n                  {\n                      \"type\": \"paragraph\",\n                       \"text\": \"Content for sub-subheading 1.2\"\n                    }\n                ]\n              }\n           }\n         ]\n        }\n      },\n      {\n          \"heading\": {\n          \"level\": 2,\n          \"text\": \"Subheading 2\",\n          \"content\": [\n              {\n              \"type\": \"paragraph\",\n              \"text\": \"Content related to Subheading 2.\"\n             },\n             {\n               \"heading\": {\n                  \"level\": 3,\n                  \"text\": \"Sub-subheading 2.1\",\n                 \"content\": [\n                  {\n                    \"type\": \"paragraph\",\n                    \"text\": \"Content for sub-subheading 2.1\"\n                    }\n                   ]\n                 }\n              }\n            ]\n          }\n        }\n       ]\n    }\n  }\n}\n" },
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

    // Format the response as JSON
    const result = {
      status: 'success',
      analysis: response.data.choices[0].message.content
    };
    
    return JSON.stringify(result);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to analyze text with OpenAI');
  }
}

// Start the server
app.listen(port, () => {
  console.log(JSON.stringify({
    status: 'running',
    port: port
  }));
});