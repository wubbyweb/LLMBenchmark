# Text Analysis Tool

A web application for text analysis and heading generation using the OpenAI API.

## Features

- Upload text files
- Analyze text content using OpenAI's GPT-3.5 or GPT-4
- Generate hierarchical headings (level 1 through 5)
- View processed text with headings
- Option to view original text
- Download processed text

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/text-analysis-tool.git
   cd text-analysis-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Upload a text file by either:
   - Dragging and dropping a file into the upload area
   - Clicking the "Browse Files" button and selecting a file

2. Click the "Analyze Text" button to process the file.

3. View the results with hierarchical headings.

4. Use the "Show/Hide Original Text" button to toggle between the processed text and the original text.

5. Download the processed text using the "Download Processed Text" button.

## Project Structure

```
text-analysis-tool/
├── public/
│   └── index.html
├── uploads/
├── node_modules/
├── .env
├── package.json
└── server.js
```

## API Endpoints

- `POST /api/upload`: Upload a text file and get it analyzed

## Development

To contribute to this project:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run tests to ensure everything works
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or issues, please open an issue in the repository or contact the project maintainer.