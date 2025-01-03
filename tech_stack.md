## Tech Stack

- Linux
- Python (FastAPI)
- HTML
- CSS
- JavaScript
- WebSocket

## Version

- Linux     Debian 11 (Bullseye)
- Python    Python 3.10.12
- FastAPI   FastAPI 0.95.2
- WebSocket WebSocket 1.0.0
- HTML      HTML5
- CSS       CSS3
- JavaScript JavaScript ES6 (ECMAScript 2015)

## Browser Support

### Desktop Browsers
- Chrome 51+ (2016+)
- Firefox 54+ (2017+)
- Safari 10+ (2016+)
- Edge 15+ (2017+)
- Opera 38+ (2016+)

### Mobile Browsers
- iOS Safari 12.2+ (2019+)
- Android Chrome 51+ (2016+)
- Samsung Internet 5+ (2016+)
- Firefox for Android 54+ (2017+)
- Opera Mobile 46+ (2017+)

Note: These versions represent >98% of global browser usage as of 2024.

## VSCode setup
```bash
# Create venv
python3 -m venv venv

# Activate venv
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install requirements with proxy
pip3 --proxy http://ip:port --trusted-host pypi.org --trusted-host files.pythonhosted.org install -r requirements.txt

# Install dependencies directly
pip3 install -r requirements.txt
```

<!-- .vscode/settings.json -->
```JSON
{
    "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
    "python.analysis.extraPaths": ["${workspaceFolder}/venv/lib/python3.11/site-packages"]
}
```

## Local http server setup
```bash
cd src
python3 -m http.server 8000
```