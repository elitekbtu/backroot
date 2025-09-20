#!/bin/bash

# Universal SSL Certificate Renewal Script
# This script automatically renews SSL certificates and works with the universal nginx.conf
# Add to crontab: 0 12 * * * /path/to/this/script.sh

echo "=== SSL Certificate Renewal Process ==="
echo "$(date): Starting certificate renewal check..."

# Get the script directory (works even when run from cron)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if docker compose is available
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "❌ docker compose not found!"
    exit 1
fi

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
    echo "⚠️  Services not running, starting them..."
    docker compose up -d
    sleep 10
fi

echo "🔄 Checking certificate renewal..."
# Try to renew certificates (certbot only renews if needed)
docker compose run --rm certbot renew --quiet

if [ $? -eq 0 ]; then
    echo "✅ Certificate check/renewal successful"
    
    # Reload nginx to use any new certificates
    if docker compose exec frontend nginx -s reload; then
        echo "✅ Nginx reloaded successfully"
        
        # Test the HTTPS connection
        if curl -s -I https://theb2r.com | grep -q "HTTP/2 200"; then
            echo "✅ HTTPS is working correctly"
        else
            echo "⚠️  HTTPS test failed, but certificates were renewed"
        fi
    else
        echo "⚠️  Failed to reload nginx"
    fi
    
    echo "$(date): Certificate renewal process completed successfully"
else
    echo "❌ Certificate renewal failed!"
    echo "$(date): Certificate renewal failed" >&2
    exit 1
fi
