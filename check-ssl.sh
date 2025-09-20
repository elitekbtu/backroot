#!/bin/bash

# Universal Configuration Check Script
# Tests both local development and production setup

echo "=== Universal Configuration Check ==="
echo "This script checks both local (localhost) and production (theb2r.com) setups"
echo

# Determine what to check based on arguments
MODE="both"
if [ "$1" = "local" ]; then
    MODE="local"
elif [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    MODE="prod"
fi

echo "Mode: $MODE"
echo

# Function to check local setup
check_local() {
    echo "🏠 === LOCAL DEVELOPMENT CHECK ==="
    
    # Check if services are running
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        echo "✅ Docker services are running"
    else
        echo "❌ Docker services not running"
        echo "   Run: docker-compose up -d"
        return 1
    fi
    
    # Check localhost HTTP
    if curl -s -I http://localhost | grep -q "200"; then
        echo "✅ HTTP localhost is working"
    else
        echo "❌ HTTP localhost not accessible"
        echo "   Check if port 80 is available"
    fi
    
    # Check API
    if curl -s http://localhost/api/ | grep -q -E "(404|200|302)"; then
        echo "✅ API proxy is working"
    else
        echo "⚠️  API proxy not responding (backend might be down)"
    fi
    
    echo
}

# Function to check production setup
check_production() {
    echo "🌐 === PRODUCTION CHECK ==="
    
    # Check DNS resolution
    echo "1. Checking DNS resolution..."
    IP=$(dig +short theb2r.com)
    if [ -n "$IP" ]; then
        echo "✅ theb2r.com resolves to: $IP"
    else
        echo "❌ Failed to resolve theb2r.com"
        return 1
    fi

    # Check if ports are accessible
    echo "2. Checking port accessibility..."
    if nc -z theb2r.com 80 2>/dev/null; then
        echo "✅ Port 80 is accessible"
    else
        echo "❌ Port 80 is not accessible"
    fi

    if nc -z theb2r.com 443 2>/dev/null; then
        echo "✅ Port 443 is accessible"
    else
        echo "❌ Port 443 is not accessible"
    fi

    # Check HTTP redirect
    echo "3. Checking HTTP to HTTPS redirect..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://theb2r.com)
    if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo "✅ HTTP redirects to HTTPS (Status: $HTTP_STATUS)"
    else
        echo "❌ HTTP redirect not working (Status: $HTTP_STATUS)"
    fi

    # Check HTTPS certificate
    echo "4. Checking HTTPS certificate..."
    if curl -s -I https://theb2r.com >/dev/null 2>&1; then
        echo "✅ HTTPS is working"
        
        # Get certificate details
        CERT_INFO=$(echo | openssl s_client -servername theb2r.com -connect theb2r.com:443 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
        if [ -n "$CERT_INFO" ]; then
            echo "📋 Certificate details:"
            echo "$CERT_INFO"
        fi
        
        # Check certificate expiration
        DAYS_LEFT=$(echo | openssl s_client -servername theb2r.com -connect theb2r.com:443 2>/dev/null | openssl x509 -noout -checkend 2592000 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "✅ Certificate is valid for more than 30 days"
        else
            echo "⚠️  Certificate expires within 30 days - renewal needed"
        fi
    else
        echo "❌ HTTPS is not working"
    fi

    # Check Docker services
    echo "5. Checking Docker services..."
    if docker-compose ps | grep -q "frontend.*Up"; then
        echo "✅ Frontend service is running"
    else
        echo "❌ Frontend service is not running"
    fi

    if docker-compose ps | grep -q "backend.*Up"; then
        echo "✅ Backend service is running"
    else
        echo "❌ Backend service is not running"
    fi
    
    echo
}

# Main execution
case $MODE in
    "local")
        check_local
        ;;
    "prod")
        check_production
        ;;
    "both")
        check_local
        check_production
        ;;
esac

echo "=== Check completed ==="
echo
echo "💡 Usage:"
echo "   $0           # Check both local and production"
echo "   $0 local     # Check only local development"
echo "   $0 prod      # Check only production"
