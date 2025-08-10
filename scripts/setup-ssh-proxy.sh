#!/bin/bash

# SSH Proxy Setup Script
# Sets up the SSH proxy server with new SSL certificate using DNS name
# Author: CKA Simulator Team
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SSH_PROXY_HOST="ssh-proxy.cislab.link"
SSH_KEY_PATH="~/.ssh/my-ec2-key.pem"

log "Setting up SSH Proxy Server with DNS-based SSL certificate..."

# Test SSH connectivity
log "Testing SSH connectivity to $SSH_PROXY_HOST..."
if ! ssh -i $SSH_KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$SSH_PROXY_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    error "Cannot connect to SSH proxy server. Please ensure:"
    error "1. Instance is running (use ./infrastructure-manager.sh start)"
    error "2. DNS records are updated"
    error "3. SSH key is available at $SSH_KEY_PATH"
    exit 1
fi

success "SSH connectivity confirmed"

# Generate new SSL certificate with DNS name
log "Generating SSL certificate for $SSH_PROXY_HOST..."
ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ubuntu@$SSH_PROXY_HOST "
cd ~/ssh-proxy-server &&
echo 'Generating new SSL certificate with DNS name...' &&
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj '/C=US/ST=Virginia/L=AWS/O=CKA-Simulator/CN=$SSH_PROXY_HOST' &&
chmod 600 key.pem &&
chmod 644 cert.pem &&
echo 'SSL certificate generated successfully'
"

if [ $? -ne 0 ]; then
    error "Failed to generate SSL certificate"
    exit 1
fi

success "SSL certificate generated with DNS name"

# Update SSH proxy configuration
log "Updating SSH proxy configuration..."
ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ubuntu@$SSH_PROXY_HOST "
cd ~/ssh-proxy-server &&
echo 'Updating configuration with DNS names...' &&
sed -i 's/K8S_MASTER_IP=.*/K8S_MASTER_IP=master01.cislab.link/' .env &&
echo 'Configuration updated successfully'
"

if [ $? -ne 0 ]; then
    error "Failed to update configuration"
    exit 1
fi

success "Configuration updated with DNS names"

# Restart SSH proxy server
log "Restarting SSH proxy server..."
ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ubuntu@$SSH_PROXY_HOST "
cd ~/ssh-proxy-server &&
echo 'Stopping existing server...' &&
pkill -f 'node server-https.js' || true &&
sleep 2 &&
echo 'Starting server with new configuration...' &&
nohup node server-https.js > server-https.log 2>&1 &
sleep 3 &&
echo 'Server restarted successfully'
"

if [ $? -ne 0 ]; then
    error "Failed to restart SSH proxy server"
    exit 1
fi

success "SSH proxy server restarted"

# Test server health
log "Testing server health..."
sleep 5
if curl -k -s https://$SSH_PROXY_HOST:3001/health | grep -q "healthy"; then
    success "SSH proxy server is healthy and responding"
    log "Health endpoint: https://$SSH_PROXY_HOST:3001/health"
else
    error "SSH proxy server health check failed"
    exit 1
fi

success "SSH Proxy setup completed successfully!"
log "Server is ready at: wss://$SSH_PROXY_HOST:3001"
log "Health check: https://$SSH_PROXY_HOST:3001/health"