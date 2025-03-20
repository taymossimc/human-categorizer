const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Ensure data directory exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
    console.log('Created data directory');
}

// Define paths for CSV files
const messagesPath = path.join(__dirname, 'data', 'corpus.csv');
const categoriesPath = path.join(__dirname, 'data', 'categories.csv');
const participantsPath = path.join(__dirname, 'data', 'participant_list.csv');
const resultsPath = path.join(__dirname, 'data', 'results.csv');

// Function to parse CSV with headers
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(header => header.trim());
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle quoted values that might contain commas
        const values = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const obj = {};
        for (let j = 0; j < headers.length && j < values.length; j++) {
            obj[headers[j]] = values[j].replace(/^"|"$/g, ''); // Remove surrounding quotes
        }
        results.push(obj);
    }
    
    return results;
}

// Function to convert object array to CSV
function objectsToCSV(objects, headers) {
    if (!objects || objects.length === 0) return '';
    
    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(objects[0]);
    const headerRow = csvHeaders.join(',');
    
    const rows = objects.map(obj => {
        return csvHeaders.map(header => {
            // Handle values that might contain commas or quotes
            const value = obj[header] !== undefined ? obj[header] : '';
            const stringValue = String(value);
            
            // Escape quotes and wrap in quotes if contains commas or quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });
    
    return headerRow + '\n' + rows.join('\n');
}

// Function to append a row to CSV
function appendToCSV(filePath, rowObject, headers) {
    try {
        let csvContent = '';
        let existingObjects = [];
        const fileExists = fs.existsSync(filePath);
        
        if (fileExists) {
            // Read existing content
            csvContent = fs.readFileSync(filePath, 'utf8');
            
            // If file is empty or just has headers, initialize content
            if (!csvContent || csvContent.trim() === '') {
                csvContent = headers.join(',') + '\n';
            } else if (!csvContent.includes('\n')) {
                // File only has header row
                csvContent += '\n';
            }
            
            // Parse existing content if there's data
            if (csvContent.includes('\n') && csvContent.split('\n').length > 1) {
                existingObjects = parseCSV(csvContent);
            }
        } else {
            // Create new file with headers
            csvContent = headers.join(',') + '\n';
            fs.writeFileSync(filePath, csvContent);
        }
        
        // Create CSV row from object
        const row = headers.map(header => {
            const value = rowObject[header] !== undefined ? rowObject[header] : '';
            const stringValue = String(value);
            
            // Escape quotes and wrap in quotes if contains commas or quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
        
        // Append new row and write back to file
        fs.appendFileSync(filePath, row + '\n');
        return true;
    } catch (error) {
        console.error(`Error appending to CSV ${filePath}:`, error);
        return false;
    }
}

// Get messages for the experiment
app.get('/api/messages', (req, res) => {
    try {
        console.log('Request received for /api/messages');
        
        if (fs.existsSync(messagesPath)) {
            const messagesData = fs.readFileSync(messagesPath, 'utf8');
            
            // Parse CSV for messages
            const allMessages = parseCSV(messagesData);
            console.log(`Parsed ${allMessages.length} messages from CSV`);
            
            // Convert CSV data to expected format
            const messages = allMessages.map((msg, index) => {
                return {
                    msg_id: msg.id || String(index + 1),
                    content: msg.text || msg.content || msg.message || msg.body || "No content available"
                };
            });
            
            // Select 15 random messages if there are more than 15
            let selectedMessages = messages;
            if (messages.length > 15) {
                selectedMessages = [];
                const indices = new Set();
                while (indices.size < 15) {
                    indices.add(Math.floor(Math.random() * messages.length));
                }
                indices.forEach(index => {
                    selectedMessages.push(messages[index]);
                });
            }
            
            console.log(`Serving ${selectedMessages.length} messages for experiment`);
            return res.json(selectedMessages);
        } else {
            console.error('Messages CSV file not found at path:', messagesPath);
            return res.status(404).json({ error: 'Messages file not found' });
        }
    } catch (error) {
        console.error('Error retrieving messages:', error);
        return res.status(500).json({ error: 'Server error retrieving messages', details: error.message });
    }
});

// Get categories
app.get('/api/categories', (req, res) => {
    try {
        console.log('Request received for /api/categories');
        
        if (fs.existsSync(categoriesPath)) {
            const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
            
            // Parse CSV for categories
            const csvCategories = parseCSV(categoriesData);
            console.log(`Parsed ${csvCategories.length} categories from CSV`);
            
            // Convert CSV data to expected format
            const categories = csvCategories.map((cat, index) => {
                return {
                    id: cat.id || String(index + 1),
                    name: cat.name || cat.category || cat.title || "Category " + (index + 1),
                    description: cat.description || cat.desc || ""
                };
            });
            
            console.log(`Serving ${categories.length} categories`);
            return res.json(categories);
        } else {
            console.error('Categories CSV file not found at path:', categoriesPath);
            return res.status(404).json({ error: 'Categories not found' });
        }
    } catch (error) {
        console.error('Error retrieving categories:', error);
        return res.status(500).json({ error: 'Server error retrieving categories', details: error.message });
    }
});

// Save participant response
app.post('/api/save-response', (req, res) => {
    try {
        console.log('Received response:', req.body);
        const { msg_id, participant_id, category_id, confidence_score, timestamp } = req.body;
        
        // Validate required fields
        if (!msg_id || !participant_id || !category_id) {
            console.error('Missing required fields in request:', req.body);
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Convert confidence score to a decimal between 0.00 and 1.00
        const normalizedConfidence = Number(confidence_score) / 100;
        const confidenceFormatted = parseFloat(normalizedConfidence.toFixed(2));
        
        // Prepare the row object
        const newResponse = {
            msg_id,
            participant_id,
            category_id,
            confidence_score: confidenceFormatted,
            timestamp: timestamp || new Date().toISOString()
        };
        
        // Define headers for results CSV
        const resultHeaders = ['msg_id', 'participant_id', 'category_id', 'confidence_score', 'timestamp'];
        
        // Append to results.csv
        const success = appendToCSV(resultsPath, newResponse, resultHeaders);
        
        if (success) {
            console.log(`Saved response from participant ${participant_id} for message ${msg_id} with confidence ${confidenceFormatted}`);
            res.json({ success: true });
        } else {
            throw new Error('Failed to save response to CSV');
        }
    } catch (error) {
        console.error('Error saving response:', error);
        res.status(500).json({ error: 'Failed to save response', details: error.message });
    }
});

// Complete experiment endpoint
app.post('/api/complete-experiment', (req, res) => {
    try {
        console.log('Received experiment completion request:', req.body);
        const { participant_id } = req.body;
        
        // Validate required field
        if (!participant_id) {
            console.error('Missing participant_id in request');
            return res.status(400).json({ error: 'Missing participant_id' });
        }
        
        // Simply acknowledge the completion without updating timestamps
        console.log(`Experiment completed for participant ${participant_id}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error completing experiment:', error);
        res.status(500).json({ error: 'Failed to complete experiment', details: error.message });
    }
});

// Register a new participant
app.post('/api/register-participant', (req, res) => {
    try {
        console.log('Received participant registration:', req.body);
        const { participant_id, name, email, timestamp_start } = req.body;
        
        if (!participant_id) {
            return res.status(400).json({ error: 'Missing participant_id' });
        }
        
        // Prepare participant data (without timestamp_end)
        const newParticipant = {
            participant_id,
            name: name || '',
            email: email || '',
            timestamp_start: timestamp_start || new Date().toISOString()
        };
        
        // Define headers for participant CSV (without timestamp_end)
        const participantHeaders = ['participant_id', 'name', 'email', 'timestamp_start'];
        
        // Check if the participant already exists
        let participantExists = false;
        if (fs.existsSync(participantsPath)) {
            const csvContent = fs.readFileSync(participantsPath, 'utf8');
            const participants = parseCSV(csvContent);
            participantExists = participants.some(p => p.participant_id === participant_id);
        }
        
        if (participantExists) {
            console.log(`Participant ${participant_id} already registered`);
            return res.status(400).json({ error: 'Participant ID already exists' });
        }
        
        // Append to participant_list.csv
        const success = appendToCSV(participantsPath, newParticipant, participantHeaders);
        
        if (success) {
            console.log(`Registered new participant: ${participant_id}`);
            res.json({ success: true });
        } else {
            throw new Error('Failed to register participant in CSV');
        }
    } catch (error) {
        console.error('Error registering participant:', error);
        res.status(500).json({ error: 'Failed to register participant', details: error.message });
    }
});

// Create a completion.html file if it doesn't exist
const completionHtmlPath = path.join(__dirname, 'public', 'completion.html');
if (!fs.existsSync(completionHtmlPath)) {
    const completionHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Experiment Completed</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 30px;
            text-align: center;
        }
        h1 {
            color: #4CAF50;
        }
        .message {
            margin: 30px 0;
            font-size: 18px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Thank You!</h1>
        <div class="message">
            <p>You have successfully completed the message categorization experiment.</p>
            <p>Your contributions are valuable and will help improve our understanding of message categories.</p>
            <p>You may now close this window.</p>
        </div>
    </div>
</body>
</html>
    `;
    fs.writeFileSync(completionHtmlPath, completionHtml);
    console.log('Created completion.html file');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to start`);
}); 