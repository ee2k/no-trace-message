import { $ } from './utils/dom.js';

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Update uptime
        $('#uptime').textContent = data.uptime;
        
        // Format and display startup time
        const startupDate = new Date(data.startup_time);
        $('#startupTime').textContent = 
            `Started: ${startupDate.toLocaleString()}`;
        
        // Update message counts
        $('#messagesCreated').textContent = data.messages_created.toLocaleString();
        // $('#messagesRead').textContent = data.messages_read.toLocaleString();
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load stats immediately and refresh every minute
loadStats();
setInterval(loadStats, 60000); 