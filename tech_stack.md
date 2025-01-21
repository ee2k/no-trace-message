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
# Install python3-venv package
sudo apt-get update
sudo apt-get install python3-venv

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
pip install -r requirements.txt
# or 
pip3 install -r requirements.txt
```

<!-- .vscode/settings.json -->
```JSON
{
    "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
    "python.analysis.extraPaths": ["${workspaceFolder}/venv/lib/python3.11/site-packages"]
}
```

# Deployment
```bash
# Development
./scripts/start.sh
development

# Staging
./scripts/start.sh
staging

# Production
./scripts/start.sh
production
```

# Nginx configuration
```text
http {
    include       mime.types;
    default_type  application/octet-stream;

    # Define log format
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';

    # Enable access log
    access_log  /usr/local/var/log/nginx/access.log  main;
    error_log   /usr/local/var/log/nginx/error.log;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    gzip  on;

    server {
        listen       80;
        server_name  localhost;

        # Root directory for static files - adjust path to your local project
        root /Path/to/burning-message/frontend;

        # Static assets - no rewriting
        location /static/ {
            #expires 1h;
            #add_header Cache-Control "public, no-transform";
            
            error_log /usr/local/var/log/nginx/static_error.log debug;
            access_log /usr/local/var/log/nginx/static_access.log main;
            
            try_files $uri $uri/ =404;
        }

        # API requests - no rewriting
        location /api/ {
            proxy_pass http://127.0.0.1:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # HTML pages with matching filenames
        location ~ ^/(message|chatroom|join-private-chatroom)/ {
            try_files $uri /$1.html;
        }

        # Remove .html and .htm suffix for all other paths
        location / {
            if ($request_uri ~ ^/(.*)\.(html|htm)$) {
                return 301 /$1;
            }
            try_files $uri $uri.html $uri.htm $uri/ =404;
        }
    }

    include servers/*;
}
```