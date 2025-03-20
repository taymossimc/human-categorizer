# Human Categorizer

A web application for human-assisted categorization of chatbot messages. This tool allows researchers to gather human judgments for message classification, helping to improve chatbot response systems and message categorization algorithms.

## Overview

This application provides:
- A web interface for study participants to categorize messages
- CSV log parsing capabilities for chatbot conversation data
- Data collection and export functionality
- Participant tracking system to document consent and anonmyze identity.

## Project Structure

- `/public` - Frontend HTML, CSS, and client-side JavaScript
- `/data` - Storage for CSV files containing corpus, categories, participant lists, and results
- `server.js` - Express.js backend server
- `script.js` - Client-side logic for the JSON log parser functionality

## Setup

### Prerequisites

- Node.js (v12 or higher)
- npm

### Installation

1. Clone this repository:
   ```
   git clone [repository URL]
   cd human-categorizer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Setup the data directory (the application will create this automatically if it doesn't exist):
   ```
   mkdir -p data
   ```

4. Start the server:
   ```
   npm start
   ```

5. Access the application at `http://localhost:3000`

## Usage

### Participant Flow

1. Participants visit the index page and enter their participant code (if provided)
2. New participants without a code will be directed to the signup page
3. After signup/login, participants are presented with messages to categorize
4. Results are stored and can be downloaded by researchers

### Researcher Tools

Researchers can:
- Upload JSON logs of chatbot conversations for analysis
- Define categories for classification
- Export results in CSV format
- Track participant progress

## File Formats

### Input JSON Structure

The application accepts JSON files with the following structure:
```json
{
  "chatbotId": "...",
  "chatbotName": "...",
  "conversations": [
    {
      "messages": [
        {
          "content": "...",
          "role": "..."
        }
      ]
    }
  ]
}
```

### Output CSV Structure

Results are saved in CSV format with categorization data from participants.

## Contact

For questions about this study, please contact: imc@tucc.ca 