document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const rowCount = document.getElementById('rowCount');
    const chatbotId = document.getElementById('chatbotId');
    const chatbotName = document.getElementById('chatbotName');
    const testBtn = document.getElementById('testBtn');
    const executeBtn = document.getElementById('executeBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const previewSection = document.getElementById('previewSection');
    const previewBody = document.getElementById('previewBody');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultSection = document.getElementById('resultSection');
    const csvFileName = document.getElementById('csvFileName');
    const csvFileSize = document.getElementById('csvFileSize');
    const downloadBtn = document.getElementById('downloadBtn');

    // State variables
    let jsonData = null;
    let csvData = null;
    let worker = null;
    let isPaused = false;

    // Event Listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('drag-over');
    }

    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }

    // Handle file drop
    dropArea.addEventListener('drop', handleDrop, false);
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file input change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Click on drop area to trigger file input
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle the uploaded files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('Please upload a JSON file');
            return;
        }

        // Reset state
        resetState();
        
        // Display file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'block';
        
        // Read the file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                jsonData = JSON.parse(e.target.result);
                analyzeJsonData(jsonData);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
                resetState();
            }
        };
        reader.readAsText(file);
    }

    // Analyze the JSON data to extract information
    function analyzeJsonData(data) {
        try {
            // Count the number of content entries
            let contentCount = 0;
            
            // Extract chatbot information
            let chatbotIdValue = 'N/A';
            let chatbotNameValue = 'N/A';
            
            // Check for chatbot info at the top level first
            if (data.chatbotId) chatbotIdValue = data.chatbotId;
            if (data.chatbotName) chatbotNameValue = data.chatbotName;
            
            // Look for chatbot info in different possible locations
            if (data.chatbot) {
                if (data.chatbot.id) chatbotIdValue = data.chatbot.id;
                if (data.chatbot.name) chatbotNameValue = data.chatbot.name;
            }
            
            // Assuming the structure has a conversations array
            if (data.conversations && Array.isArray(data.conversations)) {
                data.conversations.forEach(conversation => {
                    if (conversation.messages && Array.isArray(conversation.messages)) {
                        contentCount += conversation.messages.length;
                    }
                    
                    // Try to extract chatbot info from the first conversation if not found yet
                    if (chatbotIdValue === 'N/A') {
                        if (conversation.chatbotId) chatbotIdValue = conversation.chatbotId;
                        if (conversation.chatbot && conversation.chatbot.id) chatbotIdValue = conversation.chatbot.id;
                    }
                    
                    if (chatbotNameValue === 'N/A') {
                        if (conversation.chatbotName) chatbotNameValue = conversation.chatbotName;
                        if (conversation.chatbot && conversation.chatbot.name) chatbotNameValue = conversation.chatbot.name;
                    }
                });
            }
            
            // If we still don't have chatbot info, look in the first message
            if ((chatbotIdValue === 'N/A' || chatbotNameValue === 'N/A') && 
                data.conversations && 
                data.conversations[0] && 
                data.conversations[0].messages && 
                data.conversations[0].messages[0]) {
                
                const firstMessage = data.conversations[0].messages[0];
                
                if (chatbotIdValue === 'N/A' && firstMessage.chatbotId) {
                    chatbotIdValue = firstMessage.chatbotId;
                }
                
                if (chatbotNameValue === 'N/A' && firstMessage.chatbotName) {
                    chatbotNameValue = firstMessage.chatbotName;
                }
            }
            
            // Update UI with the analysis results
            rowCount.textContent = contentCount.toString();
            chatbotId.textContent = chatbotIdValue;
            chatbotName.textContent = chatbotNameValue;
            
            // Enable the test button
            testBtn.disabled = false;
            executeBtn.disabled = false;
        } catch (error) {
            alert('Error analyzing JSON data: ' + error.message);
            resetState();
        }
    }

    // Format file size to human-readable format
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Reset application state
    function resetState() {
        jsonData = null;
        csvData = null;
        
        // Reset UI elements
        fileInfo.style.display = 'none';
        previewSection.style.display = 'none';
        progressSection.style.display = 'none';
        resultSection.style.display = 'none';
        
        // Reset buttons
        testBtn.disabled = true;
        executeBtn.disabled = true;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        
        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // Terminate worker if exists
        if (worker) {
            worker.terminate();
            worker = null;
        }
        
        isPaused = false;
    }

    // Preview the first 5 rows
    testBtn.addEventListener('click', () => {
        if (!jsonData) return;
        
        try {
            const previewData = generatePreviewData(jsonData, 5);
            displayPreviewData(previewData);
            previewSection.style.display = 'block';
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    });

    // Generate preview data from JSON
    function generatePreviewData(data, limit) {
        const previewRows = [];
        let count = 0;
        
        // Extract global chatbot information from various possible locations
        let globalChatbotId = '';
        let globalChatbotName = '';
        let globalStartDate = '';
        let globalEndDate = '';
        
        // Check top level
        if (data.chatbotId) globalChatbotId = data.chatbotId;
        if (data.chatbotName) globalChatbotName = data.chatbotName;
        if (data.startDate) globalStartDate = data.startDate;
        if (data.endDate) globalEndDate = data.endDate;
        
        // Check chatbot object
        if (data.chatbot) {
            if (data.chatbot.id && !globalChatbotId) globalChatbotId = data.chatbot.id;
            if (data.chatbot.name && !globalChatbotName) globalChatbotName = data.chatbot.name;
        }
        
        if (data.conversations && Array.isArray(data.conversations)) {
            for (const conversation of data.conversations) {
                // Extract conversation-level data with fallbacks to global values
                let chatbotId = globalChatbotId;
                let chatbotName = globalChatbotName;
                let startDate = globalStartDate;
                let endDate = globalEndDate;
                
                // Override with conversation-specific values if available
                if (conversation.chatbotId) chatbotId = conversation.chatbotId;
                if (conversation.chatbotName) chatbotName = conversation.chatbotName;
                if (conversation.startDate) startDate = conversation.startDate;
                if (conversation.endDate) endDate = conversation.endDate;
                
                // Check chatbot object in conversation
                if (conversation.chatbot) {
                    if (conversation.chatbot.id) chatbotId = conversation.chatbot.id;
                    if (conversation.chatbot.name) chatbotName = conversation.chatbot.name;
                }
                
                if (conversation.messages && Array.isArray(conversation.messages)) {
                    for (const message of conversation.messages) {
                        if (count >= limit) break;
                        
                        previewRows.push({
                            chatbotId: chatbotId || 'N/A',
                            chatbotName: chatbotName || 'N/A',
                            startDate: startDate || 'N/A',
                            endDate: endDate || 'N/A',
                            conversationId: conversation.id || 'N/A',
                            createdAt: message.created_at || 'N/A',
                            lastMessageAt: conversation.last_message_at || 'N/A',
                            role: message.role || 'N/A',
                            score: message.score !== undefined ? message.score : 'N/A',
                            content: message.content || 'N/A',
                            formSubmission: message.form_submission || 'N/A',
                            source: message.source || 'N/A'
                        });
                        
                        count++;
                    }
                    
                    if (count >= limit) break;
                }
            }
        }
        
        return previewRows;
    }

    // Display preview data in the table
    function displayPreviewData(previewData) {
        previewBody.innerHTML = '';
        
        previewData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Add cells for each column
            const columns = [
                'chatbotId', 'chatbotName', 'startDate', 'endDate', 
                'conversationId', 'createdAt', 'lastMessageAt', 
                'role', 'score', 'content', 'formSubmission', 'source'
            ];
            
            columns.forEach(column => {
                const td = document.createElement('td');
                let content = row[column];
                
                // Truncate long content
                if (column === 'content' && content.length > 100) {
                    content = content.substring(0, 100) + '...';
                }
                
                td.textContent = content;
                tr.appendChild(td);
            });
            
            previewBody.appendChild(tr);
        });
    }

    // Execute the conversion
    executeBtn.addEventListener('click', () => {
        if (!jsonData) return;
        
        // Show progress section
        progressSection.style.display = 'block';
        resultSection.style.display = 'none';
        
        // Disable test and execute buttons, enable pause and stop
        testBtn.disabled = true;
        executeBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        
        // Create a worker for the conversion
        worker = new Worker(URL.createObjectURL(new Blob([`
            // Worker for JSON to CSV conversion
            
            self.onmessage = function(e) {
                const { jsonData, command } = e.data;
                
                if (command === 'start') {
                    convertJsonToCsv(jsonData);
                } else if (command === 'pause') {
                    // Pause functionality would be implemented here
                    // For simplicity, we'll just acknowledge the pause
                    self.postMessage({ type: 'paused' });
                } else if (command === 'resume') {
                    // Resume functionality would be implemented here
                    self.postMessage({ type: 'resumed' });
                }
            };
            
            function convertJsonToCsv(data) {
                try {
                    // Define CSV header
                    const header = [
                        'chatbotId', 'chatbotName', 'startDate', 'endDate', 
                        'conversationId', 'createdAt', 'lastMessageAt', 
                        'role', 'score', 'content', 'formSubmission', 'source'
                    ];
                    
                    // Start with the header
                    let csvContent = header.join(',') + '\\n';
                    
                    // Count total messages for progress tracking
                    let totalMessages = 0;
                    let processedMessages = 0;
                    
                    // Extract global chatbot information from various possible locations
                    let globalChatbotId = '';
                    let globalChatbotName = '';
                    let globalStartDate = '';
                    let globalEndDate = '';
                    
                    // Check top level
                    if (data.chatbotId) globalChatbotId = data.chatbotId;
                    if (data.chatbotName) globalChatbotName = data.chatbotName;
                    if (data.startDate) globalStartDate = data.startDate;
                    if (data.endDate) globalEndDate = data.endDate;
                    
                    // Check chatbot object
                    if (data.chatbot) {
                        if (data.chatbot.id && !globalChatbotId) globalChatbotId = data.chatbot.id;
                        if (data.chatbot.name && !globalChatbotName) globalChatbotName = data.chatbot.name;
                    }
                    
                    // Count total messages
                    if (data.conversations && Array.isArray(data.conversations)) {
                        data.conversations.forEach(conversation => {
                            if (conversation.messages && Array.isArray(conversation.messages)) {
                                totalMessages += conversation.messages.length;
                            }
                        });
                    }
                    
                    // Process each conversation
                    if (data.conversations && Array.isArray(data.conversations)) {
                        data.conversations.forEach(conversation => {
                            // Extract conversation-level data with fallbacks to global values
                            let chatbotId = globalChatbotId;
                            let chatbotName = globalChatbotName;
                            let startDate = globalStartDate;
                            let endDate = globalEndDate;
                            
                            // Override with conversation-specific values if available
                            if (conversation.chatbotId) chatbotId = conversation.chatbotId;
                            if (conversation.chatbotName) chatbotName = conversation.chatbotName;
                            if (conversation.startDate) startDate = conversation.startDate;
                            if (conversation.endDate) endDate = conversation.endDate;
                            
                            // Check chatbot object in conversation
                            if (conversation.chatbot) {
                                if (conversation.chatbot.id) chatbotId = conversation.chatbot.id;
                                if (conversation.chatbot.name) chatbotName = conversation.chatbot.name;
                            }
                            
                            const conversationId = conversation.id || '';
                            const lastMessageAt = conversation.last_message_at || '';
                            
                            if (conversation.messages && Array.isArray(conversation.messages)) {
                                conversation.messages.forEach(message => {
                                    // Get message-specific data
                                    const createdAt = message.created_at || '';
                                    const role = message.role || '';
                                    const score = message.score !== undefined ? message.score.toString() : '';
                                    const content = message.content || '';
                                    const formSubmission = message.form_submission || '';
                                    const source = message.source || '';
                                    
                                    // Prepare row data
                                    const row = [
                                        escapeCSV(chatbotId),
                                        escapeCSV(chatbotName),
                                        escapeCSV(startDate),
                                        escapeCSV(endDate),
                                        escapeCSV(conversationId),
                                        escapeCSV(createdAt),
                                        escapeCSV(lastMessageAt),
                                        escapeCSV(role),
                                        escapeCSV(score),
                                        escapeCSV(content),
                                        escapeCSV(formSubmission),
                                        escapeCSV(source)
                                    ];
                                    
                                    // Add row to CSV content
                                    csvContent += row.join(',') + '\\n';
                                    
                                    // Update progress
                                    processedMessages++;
                                    const progress = Math.round((processedMessages / totalMessages) * 100);
                                    
                                    // Report progress every 1% or for every message if total is small
                                    if (progress % 1 === 0 || totalMessages < 100) {
                                        self.postMessage({ 
                                            type: 'progress', 
                                            progress: progress 
                                        });
                                    }
                                });
                            }
                        });
                    }
                    
                    // Send the completed CSV data
                    self.postMessage({ 
                        type: 'complete', 
                        csvData: csvContent,
                        totalRows: totalMessages
                    });
                    
                } catch (error) {
                    self.postMessage({ 
                        type: 'error', 
                        message: error.message 
                    });
                }
            }
            
            // Helper function to escape CSV values
            function escapeCSV(value) {
                if (value === null || value === undefined) {
                    return '';
                }
                
                const stringValue = String(value);
                
                // If the value contains commas, newlines, or double quotes, enclose it in double quotes
                if (stringValue.includes(',') || stringValue.includes('\\n') || stringValue.includes('"')) {
                    // Replace double quotes with two double quotes
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                
                return stringValue;
            }
        `], { type: 'application/javascript' })));
        
        // Handle worker messages
        worker.onmessage = function(e) {
            const { type, progress, csvData, totalRows, message } = e.data;
            
            if (type === 'progress') {
                // Update progress bar and text
                progressBar.style.width = progress + '%';
                progressText.textContent = progress + '%';
            } else if (type === 'complete') {
                // Conversion completed
                progressBar.style.width = '100%';
                progressText.textContent = '100% - Completed';
                
                // Store the CSV data
                window.csvData = csvData;
                
                // Calculate CSV file size
                const csvSize = new Blob([csvData]).size;
                csvFileSize.textContent = formatFileSize(csvSize);
                
                // Generate a filename based on the current date
                const date = new Date();
                const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
                const generatedFileName = `chat_log_${timestamp}.csv`;
                csvFileName.textContent = generatedFileName;
                
                // Show result section
                resultSection.style.display = 'block';
                
                // Reset buttons
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                testBtn.disabled = false;
                executeBtn.disabled = false;
                
                // Terminate worker
                worker.terminate();
                worker = null;
            } else if (type === 'error') {
                // Handle error
                alert('Error during conversion: ' + message);
                resetState();
            } else if (type === 'paused') {
                // Handle pause state
                progressText.textContent += ' (Paused)';
            } else if (type === 'resumed') {
                // Handle resume state
                progressText.textContent = progressText.textContent.replace(' (Paused)', '');
            }
        };
        
        // Start the conversion
        worker.postMessage({ jsonData, command: 'start' });
    });

    // Pause the conversion
    pauseBtn.addEventListener('click', () => {
        if (!worker) return;
        
        if (!isPaused) {
            // Pause the worker
            worker.postMessage({ command: 'pause' });
            pauseBtn.textContent = 'Resume';
            isPaused = true;
        } else {
            // Resume the worker
            worker.postMessage({ command: 'resume' });
            pauseBtn.textContent = 'Pause';
            isPaused = false;
        }
    });

    // Stop the conversion
    stopBtn.addEventListener('click', () => {
        if (!worker) return;
        
        // Confirm before stopping
        if (confirm('Are you sure you want to stop the conversion?')) {
            // Terminate the worker
            worker.terminate();
            worker = null;
            
            // Reset UI
            progressText.textContent += ' (Stopped)';
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            testBtn.disabled = false;
            executeBtn.disabled = false;
        }
    });

    // Download the CSV file
    downloadBtn.addEventListener('click', () => {
        if (!window.csvData) return;
        
        // Create a blob from the CSV data
        const blob = new Blob([window.csvData], { type: 'text/csv' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = csvFileName.textContent;
        
        // Trigger the download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });
}); 