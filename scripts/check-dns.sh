#!/bin/bash

# DNS Propagation Checker
# Monitors DNS propagation status for CKA Simulator domains
# Author: CKA Simulator Team
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAINS=("ssh-proxy.cislab.link" "master01.cislab.link" "worker01.cislab.link")
EXPECTED_IPS=("13.222.51.177" "34.201.252.187" "54.144.18.63")
DNS_SERVERS=("8.8.8.8" "1.1.1.1" "208.67.222.222")

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check DNS resolution
check_dns_resolution() {
    local domain=$1
    local expected_ip=$2
    local dns_server=$3
    
    local resolved_ip=$(nslookup "$domain" "$dns_server" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    
    if [ "$resolved_ip" = "$expected_ip" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check all domains
check_all_domains() {
    local all_resolved=true
    
    echo "🌐 DNS Propagation Status Check"
    echo "================================"
    echo
    
    for i in "${!DOMAINS[@]}"; do
        local domain="${DOMAINS[$i]}"
        local expected_ip="${EXPECTED_IPS[$i]}"
        
        echo "Checking: $domain → $expected_ip"
        
        local resolved_count=0
        local total_servers=${#DNS_SERVERS[@]}
        
        for dns_server in "${DNS_SERVERS[@]}"; do
            if check_dns_resolution "$domain" "$expected_ip" "$dns_server"; then
                echo "  ✅ $dns_server: Resolved correctly"
                ((resolved_count++))
            else
                local actual_ip=$(nslookup "$domain" "$dns_server" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
                if [ -z "$actual_ip" ]; then
                    echo "  ❌ $dns_server: Not resolved (NXDOMAIN)"
                else
                    echo "  ⚠️  $dns_server: Resolved to $actual_ip (expected $expected_ip)"
                fi
                all_resolved=false
            fi
        done
        
        echo "  📊 Propagation: $resolved_count/$total_servers DNS servers"
        echo
    done
    
    if [ "$all_resolved" = true ]; then
        success "🎉 All domains are fully propagated!"
        return 0
    else
        warning "⏳ DNS propagation still in progress..."
        return 1
    fi
}

# Function to wait for full propagation
wait_for_propagation() {
    local max_attempts=60  # 30 minutes (30 second intervals)
    local attempt=0
    
    log "Waiting for DNS propagation to complete..."
    log "This may take 15-30 minutes depending on your domain registrar"
    echo
    
    while [ $attempt -lt $max_attempts ]; do
        if check_all_domains; then
            success "DNS propagation completed successfully!"
            return 0
        fi
        
        ((attempt++))
        local remaining=$((max_attempts - attempt))
        log "Attempt $attempt/$max_attempts - Checking again in 30 seconds... ($remaining attempts remaining)"
        sleep 30
    done
    
    error "DNS propagation timeout after 30 minutes"
    error "Please check your domain nameserver configuration"
    return 1
}

# Function to show nameserver information
show_nameserver_info() {
    echo "🌐 Required Nameserver Configuration"
    echo "===================================="
    echo
    echo "Domain: cislab.link"
    echo "Required AWS Route 53 Nameservers:"
    echo "  ns-1688.awsdns-19.co.uk"
    echo "  ns-666.awsdns-19.net"
    echo "  ns-84.awsdns-10.com"
    echo "  ns-1493.awsdns-58.org"
    echo
    echo "Please update these at your domain registrar."
    echo
}

# Function to test specific domain
test_domain() {
    local domain=$1
    if [ -z "$domain" ]; then
        error "Please specify a domain to test"
        echo "Usage: $0 test <domain>"
        exit 1
    fi
    
    echo "Testing DNS resolution for: $domain"
    echo "=================================="
    echo
    
    for dns_server in "${DNS_SERVERS[@]}"; do
        echo "Testing with DNS server: $dns_server"
        local result=$(nslookup "$domain" "$dns_server" 2>&1)
        if echo "$result" | grep -q "NXDOMAIN"; then
            echo "  ❌ Not resolved (NXDOMAIN)"
        elif echo "$result" | grep -q "Address:"; then
            local ip=$(echo "$result" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
            echo "  ✅ Resolved to: $ip"
        else
            echo "  ⚠️  Unexpected response"
        fi
        echo
    done
}

# Main script logic
case "${1:-check}" in
    check)
        check_all_domains
        ;;
    wait)
        wait_for_propagation
        ;;
    nameservers|ns)
        show_nameserver_info
        ;;
    test)
        test_domain "$2"
        ;;
    help|--help|-h)
        echo "DNS Propagation Checker for CKA Simulator"
        echo
        echo "Usage: $0 [COMMAND] [OPTIONS]"
        echo
        echo "Commands:"
        echo "  check       Check current DNS propagation status (default)"
        echo "  wait        Wait for full DNS propagation (up to 30 minutes)"
        echo "  nameservers Show required nameserver configuration"
        echo "  test <domain> Test specific domain resolution"
        echo "  help        Show this help message"
        echo
        echo "Examples:"
        echo "  $0 check                    # Check current status"
        echo "  $0 wait                     # Wait for full propagation"
        echo "  $0 test ssh-proxy.cislab.link  # Test specific domain"
        echo
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac