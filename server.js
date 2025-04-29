const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Global variable to store the latest uploaded file path
let lastUploadedFile = null;

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

    // Parse the analysis result to extract the content within the analysis tag
    const analysisTagRegex = /<analysis>([\s\S]*?)<\/analysis>/i;
    const analysisMatch = analysisResult.match(analysisTagRegex);
    
    let mindmapData = null;
    if (analysisMatch && analysisMatch[1]) {
      try {
        // Parse the JSON content within the analysis tag
        const jsonContent = JSON.parse(analysisMatch[1]);
        mindmapData = jsonContent;
      } catch (e) {
        console.error('Error parsing analysis result:', e);
      }
    }

    // Store the file path for mindmap access
    lastUploadedFile = filePath;

    // Return the result
    res.json({
      success: true,
      originalText: fileContent,
      processedText: analysisResult,
      mindmapData: mindmapData
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// API endpoint for mindmap data
app.get('/api/mindmap', (req, res) => {
  try {
    if (!lastUploadedFile) {
      return res.status(404).json({ error: 'No file has been uploaded yet' });
    }

    if (fs.existsSync(lastUploadedFile)) {
      // Read the file content
      const fileContent = fs.readFileSync(lastUploadedFile, 'utf-8');
      
      // Process the text with OpenAI
      analyzeTextWithOpenAI(fileContent)
        .then(analysisResult => {
          // Parse the analysis result to extract the content within the analysis tag
          const analysisTagRegex = /<analysis>([\s\S]*?)<\/analysis>/i;
          const analysisMatch = analysisResult.match(analysisTagRegex);
          
          if (analysisMatch && analysisMatch[1]) {
            try {
              // Parse the JSON content within the analysis tag
              const jsonContent = JSON.parse(analysisMatch[1]);
              
              // Transform the data into a mindmap format
              const mindmapData = transformToMindmap(jsonContent);
              
              res.json({
                success: true,
                mindmapData: mindmapData
              });
            } catch (e) {
              console.error('Error parsing analysis result:', e);
              res.status(500).json({ error: 'Failed to parse analysis result' });
            }
          } else {
            res.status(500).json({ error: 'No analysis data found' });
          }
        })
        .catch(error => {
          console.error('Error analyzing text:', error);
          res.status(500).json({ error: 'Failed to analyze text' });
        });
    } else {
      res.status(404).json({ error: 'No file found for analysis' });
    }
  } catch (error) {
    console.error('Error in mindmap endpoint:', error);
    res.status(500).json({ error: 'Failed to process mindmap request' });
  }
});

// Function to analyze text with OpenAI
async function analyzeTextWithOpenAI(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4",
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

// Function to transform the analysis data into a mindmap format
function transformToMindmap(data) {
  if (!data || !data.content || !data.content.heading) {
    return {
      name: "No data available",
      children: []
    };
  }

  // Create a root node
  const rootNode = {
    name: data.content.heading.text,
    children: []
  };

  // Recursively transform the hierarchical data
  function transformNode(node, parent) {
    if (!node) return;
    
    if (node.heading) {
      // Create a new node for the heading
      const newNode = {
        name: node.heading.text,
        children: []
      };
      
      // Add the new node to the parent's children
      parent.children.push(newNode);
      
      // Process the content of this node
      if (node.heading.content && node.heading.content.length > 0) {
        node.heading.content.forEach(childNode => {
          transformNode(childNode, newNode);
        });
      }
    } else if (node.content && node.content.length > 0) {
      // Process the content of this node
      node.content.forEach(childNode => {
        transformNode(childNode, parent);
      });
    }
  }

  // Process the content of the root node
  if (data.content.heading.content && data.content.heading.content.length > 0) {
    data.content.heading.content.forEach(childNode => {
      transformNode(childNode, rootNode);
    });
  }

  return rootNode;
}

// Start the server
app.listen(port, () => {
  console.log(JSON.stringify({
    status: 'running',
    port: port
  }));
});