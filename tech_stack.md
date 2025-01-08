## Tech Stack

- Linux     Debian 11 (Bullseye)
- Python    Python 3.10.12
- FastAPI   FastAPI 0.95.2
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
# On Unix/MacOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

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

## Uvicorn setup
```bash
# Basic with port
uvicorn main:app --port 80

# Development mode with auto-reload, sudo is required to bind to port 80
sudo uvicorn main:app --reload --port 80

# Production settings
uvicorn main:app \
    --host 0.0.0.0 \
    --port 80 \
    --workers 4 \
    --proxy-headers \
    --forwarded-allow-ips='*'

# With SSL/HTTPS
uvicorn main:app \
    --ssl-keyfile=./key.pem \
    --ssl-certfile=./cert.pem
```

# Deployment
```bash
# Development
ENVIRONMENT=development ./scripts/load_env.sh --reload

# Staging
nohup bash -c 'ENVIRONMENT=staging ./scripts/load_env.sh --workers 4 --port 8000' > ./logs/app.log 2>&1 &

# Production
# TODO:
```