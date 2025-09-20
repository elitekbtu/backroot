#!/bin/bash

# Universal SSL Certificate Setup Script for theb2r.com
# This script sets up SSL certificates for production deployment
# The same nginx.conf works for both local development and production

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

# Configuration
email="your-email@example.com" # Replace with your actual email
domains=(theb2r.com www.theb2r.com)
rsa_key_size=4096
staging=0 # Set to 1 for testing to avoid rate limits

echo "=== Universal SSL Setup for Production ==="
echo "Domains: ${domains[@]}"
echo "Email: $email"
echo

echo "### Starting SSL certificate setup for ${domains[0]} ###"

# Check if email is configured
if [ "$email" = "your-email@example.com" ]; then
  echo "❌ Please update the email address in this script!"
  echo "   Edit line 13: email=\"your-actual-email@example.com\""
  exit 1
fi

# Check if we have existing certificates
if docker volume ls | grep -q "certbot-etc"; then
  read -p "Existing SSL certificates found. Replace them? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    echo "Keeping existing certificates. Run 'docker-compose up -d' to start."
    exit 0
  fi
fi

echo "### Step 1: Creating temporary certificate ..."
# Create temporary self-signed certificate so nginx can start
docker-compose run --rm --entrypoint "sh -c '\
  mkdir -p /etc/letsencrypt/live/${domains[0]} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/${domains[0]}/privkey.pem \
    -out /etc/letsencrypt/live/${domains[0]}/fullchain.pem \
    -subj \"/CN=${domains[0]}\"'" certbot

echo "### Step 2: Starting services ..."
docker-compose up -d
sleep 10

echo "### Step 3: Removing temporary certificate ..."
docker-compose run --rm --entrypoint "sh -c '\
  rm -rf /etc/letsencrypt/live/${domains[0]} && \
  rm -rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -rf /etc/letsencrypt/renewal/${domains[0]}.conf'" certbot

echo "### Step 4: Getting real SSL certificate from Let's Encrypt ..."
# Build domain arguments
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Set staging flag if needed
staging_arg=""
if [ $staging != "0" ]; then 
  staging_arg="--staging"
  echo "⚠️  Using staging mode (test certificates)"
fi

# Request the real certificate
docker-compose run --rm --entrypoint "sh -c '\
  certbot certonly --webroot -w /var/www/html \
    $staging_arg \
    --email $email \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --non-interactive \
    --force-renewal'" certbot

if [ $? -eq 0 ]; then
  echo "### Step 5: Reloading nginx with new certificate ..."
  docker-compose exec frontend nginx -s reload
  
  echo
  echo "✅ SSL certificate setup completed successfully!"
  echo "🌐 Your site is now available at:"
  echo "   https://${domains[0]}"
  echo "   https://www.${domains[0]}"
  echo
  echo "📋 Next steps:"
  echo "   - Test your site: curl -I https://${domains[0]}"
  echo "   - Set up auto-renewal: crontab -e"
  echo "   - Add this line: 0 12 * * * $(pwd)/ssl-renew.sh"
else
  echo "❌ SSL certificate request failed!"
  echo "🔍 Check the logs above for details"
  echo "💡 Common issues:"
  echo "   - DNS not pointing to this server"
  echo "   - Ports 80/443 not accessible"
  echo "   - Domain not reachable from internet"
  exit 1
fi
