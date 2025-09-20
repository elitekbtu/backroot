#!/bin/bash

# Universal Mode Switcher
# Easily switch between local development and production modes

set -e

echo "=== Universal Nginx Mode Switcher ==="
echo

# Function to show usage
show_usage() {
    echo "Usage: $0 [local|prod|production]"
    echo
    echo "Commands:"
    echo "  local       - Switch to local development mode (HTTP only)"
    echo "  prod        - Switch to production mode (HTTPS with SSL)"
    echo "  production  - Same as prod"
    echo
    echo "Examples:"
    echo "  $0 local    # Start local development"
    echo "  $0 prod     # Deploy to production"
}

# Function to switch to local mode
switch_to_local() {
    echo "🏠 Switching to LOCAL DEVELOPMENT mode..."
    echo "   - HTTP only (no SSL)"
    echo "   - Available at http://localhost"
    echo "   - Short caching for development"
    echo
    
    # Stop any running services
    echo "Stopping any running services..."
    docker-compose down 2>/dev/null || true
    
    # Start in local mode
    echo "Starting services in local mode..."
    docker-compose up -d
    
    # Wait for services to start
    sleep 5
    
    echo "✅ Local development mode active!"
    echo "🌐 Open: http://localhost"
    echo "🔧 API: http://localhost/api"
    echo
    
    # Quick health check
    if curl -s -I http://localhost | grep -q "200"; then
        echo "✅ Local server is responding"
    else
        echo "⚠️  Local server not responding yet, give it a moment..."
    fi
}

# Function to switch to production mode
switch_to_production() {
    echo "🌐 Switching to PRODUCTION mode..."
    echo "   - HTTPS with Let's Encrypt SSL"
    echo "   - Available at https://theb2r.com"
    echo "   - Full security headers and caching"
    echo
    
    # Check if email is configured in init script
    if grep -q "your-email@example.com" init-letsencrypt.sh; then
        echo "❌ Please configure your email first:"
        echo "   Edit init-letsencrypt.sh line 13"
        echo "   Change: email=\"your-email@example.com\""
        echo "   To:     email=\"your-actual-email@domain.com\""
        exit 1
    fi
    
    # Stop any running services
    echo "Stopping any running services..."
    docker-compose down 2>/dev/null || true
    
    # Check if SSL certificates exist
    if docker volume ls | grep -q "certbot-etc"; then
        echo "📋 SSL certificates found, starting production services..."
        docker-compose up -d
    else
        echo "🔒 No SSL certificates found, running initial SSL setup..."
        ./init-letsencrypt.sh
    fi
    
    echo "✅ Production mode active!"
    echo "🌐 Open: https://theb2r.com"
    echo "🔒 SSL: Let's Encrypt certificates"
    echo
    
    # Quick health check
    if curl -s -I https://theb2r.com | grep -q "200"; then
        echo "✅ Production server is responding"
    else
        echo "⚠️  Production server not responding, check DNS and firewall"
    fi
}

# Function to show current status
show_status() {
    echo "📊 Current Status:"
    echo
    
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        echo "✅ Services are running"
        docker-compose ps
        
        echo
        echo "🔍 Quick Tests:"
        
        # Test localhost
        if curl -s -I http://localhost 2>/dev/null | grep -q "200"; then
            echo "✅ Local (http://localhost) - Working"
        else
            echo "❌ Local (http://localhost) - Not responding"
        fi
        
        # Test production
        if curl -s -I https://theb2r.com 2>/dev/null | grep -q "200"; then
            echo "✅ Production (https://theb2r.com) - Working"
        else
            echo "❌ Production (https://theb2r.com) - Not responding"
        fi
    else
        echo "❌ No services running"
        echo "   Run: $0 local   (for development)"
        echo "   Or:  $0 prod    (for production)"
    fi
}

# Main logic
case "${1:-status}" in
    "local"|"dev"|"development")
        switch_to_local
        ;;
    "prod"|"production"|"deploy")
        switch_to_production
        ;;
    "status"|"")
        show_status
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo
        show_usage
        exit 1
        ;;
esac
