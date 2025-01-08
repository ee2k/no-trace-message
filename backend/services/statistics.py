from datetime import datetime
import json
from pathlib import Path

class Statistics:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.startup_time = datetime.now()
            cls._instance.messages_created = 0
            cls._instance.messages_read = 0
            cls._instance.stats_file = Path("data/statistics.json")
            cls._instance.load_stats()
        return cls._instance

    def load_stats(self):
        """Load statistics from file"""
        try:
            if self.stats_file.exists():
                with open(self.stats_file, 'r') as f:
                    data = json.load(f)
                    self.messages_created = data.get('messages_created', 0)
                    self.messages_read = data.get('messages_read', 0)
        except Exception as e:
            print(f"Error loading statistics: {e}")

    def save_stats(self):
        """Save statistics to file"""
        try:
            self.stats_file.parent.mkdir(exist_ok=True)
            with open(self.stats_file, 'w') as f:
                json.dump({
                    'messages_created': self.messages_created,
                    'messages_read': self.messages_read
                }, f)
        except Exception as e:
            print(f"Error saving statistics: {e}")

    def increment_messages_created(self):
        self.messages_created += 1
        self.save_stats()

    def increment_messages_read(self):
        self.messages_read += 1
        self.save_stats()

    def get_stats(self):
        uptime = datetime.now() - self.startup_time
        days = uptime.days
        hours = uptime.seconds // 3600
        minutes = (uptime.seconds % 3600) // 60
        
        return {
            'startup_time': self.startup_time.isoformat(),
            'uptime': f"{days}d {hours}h {minutes}m",
            'messages_created': self.messages_created,
            'messages_read': self.messages_read
        } 