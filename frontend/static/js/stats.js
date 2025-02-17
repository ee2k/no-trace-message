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
        
        $('#messagesCreated').textContent = data.messages_created.toLocaleString();
        $('#chatroomsCreated').textContent = data.chatrooms_created.toLocaleString();
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load stats immediately and refresh every minute
loadStats();
setInterval(loadStats, 60000);