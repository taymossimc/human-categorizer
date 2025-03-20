# Human Categorizer

A web application for human-assisted categorization of chatbot messages. This tool allows researchers to gather human judgments for message classification, helping to improve chatbot response systems and message categorization algorithms.  This version is written for development on your localhost, but of coures it can be easily adapted to run on a Linux-based virtual machine.

Our team is providing this under the terms of CC-BY-NC. Which means that you are free to use it for non-commercial purposes. And we'd like credit if you use it or adapt it.

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
3. After signup/login, participants are presented with messages to categorize. They also assign a confidence score to their categorization
4. Results are stored and can be downloaded by researchers

### Researcher Tools

Researchers can:
- Upload CSV logs of chatbot conversations for analysis
- Define categories for classification (as CSV)
- Export results in CSV format
- Track participant consent and progress

## File Formats

### Corpus (your messages)

The application accepts CSV files with the following format.
For corpus.csv

msg_id,role,content
1,user,"How do I reset my password? I've tried multiple times but I'm not receiving the reset email."

### Categories (categories expected)

The application accepts CSV files with the following format.
For categories.csv

category_id,name,description
1,Support,Questions or issues related to technical problems with devices or software


### Output CSV

Results are saved in CSV format with categorization data from participants.

msg_id,participant_id,category_id,confidence_score,timestamp 
1,WZ81PR,3,3,2025-03-18T21:49:24.000Z

## Contact

For questions about this software or the study that created it, please contact: 
Tay Moss
imc@tucc.ca 
