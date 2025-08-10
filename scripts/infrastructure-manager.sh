#!/bin/bash

# CKA Simulator Infrastructure Manager
# Manages EC2 instances and DNS records for the CKA Simulator project
# Author: CKA Simulator Team
# Version: 1.1 - Updated for ciscloudlab.link domain

set -e

# Configuration
HOSTED_ZONE_ID="Z002910323G1G2ECVLWHF"
REGION="us-east-1"
SSH_PROXY_INSTANCE="i-0b9dd40cd97334586"
MASTER_INSTANCE="i-028a33e2124c881f5"
WORKER_INSTANCE="i-068e8e4aeac1aaf35"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    success "AWS CLI is properly configured"
}

# Function to get instance status
get_instance_status() {
    local instance_id=$1
    aws ec2 describe-instances \
        --instance-ids "$instance_id" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null || echo "unknown"
}

# Function to get instance public IP
get_instance_ip() {
    local instance_id=$1
    aws ec2 describe-instances \
        --instance-ids "$instance_id" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text 2>/dev/null || echo "none"
}

# Function to wait for instances to reach desired state
wait_for_instances() {
    local desired_state=$1
    local instances=("$SSH_PROXY_INSTANCE" "$MASTER_INSTANCE" "$WORKER_INSTANCE")
    local names=("ssh-proxy" "master01" "worker01")
    
    log "Waiting for instances to reach '$desired_state' state..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local all_ready=true
        
        for i in "${!instances[@]}"; do
            local status=$(get_instance_status "${instances[$i]}")
            if [ "$status" != "$desired_state" ]; then
                all_ready=false
                log "Instance ${names[$i]} (${instances[$i]}) is in '$status' state, waiting..."
                break
            fi
        done
        
        if [ "$all_ready" = true ]; then
            success "All instances are in '$desired_state' state"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Timeout waiting for instances to reach '$desired_state' state"
    return 1
}

# Function to update DNS records
update_dns_records() {
    log "Updating DNS records for ciscloudlab.link..."
    
    # Get current IP addresses
    local proxy_ip=$(get_instance_ip "$SSH_PROXY_INSTANCE")
    local master_ip=$(get_instance_ip "$MASTER_INSTANCE")
    local worker_ip=$(get_instance_ip "$WORKER_INSTANCE")
    
    if [ "$proxy_ip" = "none" ] || [ "$master_ip" = "none" ] || [ "$worker_ip" = "none" ]; then
        error "Could not retrieve IP addresses for all instances"
        return 1
    fi
    
    log "Current IP addresses:"
    log "  ssh-proxy: $proxy_ip"
    log "  master01:  $master_ip"
    log "  worker01:  $worker_ip"
    
    # Create change batch JSON
    local change_batch=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "ssh-proxy.ciscloudlab.link",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "$proxy_ip"}]
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "master01.ciscloudlab.link",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "$master_ip"}]
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "worker01.ciscloudlab.link",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "$worker_ip"}]
            }
        }
    ]
}
EOF
)
    
    # Update DNS records
    local change_id=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "$change_batch" \
        --query 'ChangeInfo.Id' \
        --output text)
    
    if [ $? -eq 0 ]; then
        success "DNS records updated successfully (Change ID: $change_id)"
        log "DNS records:"
        log "  ssh-proxy.ciscloudlab.link → $proxy_ip"
        log "  master01.ciscloudlab.link  → $master_ip"
        log "  worker01.ciscloudlab.link  → $worker_ip"
    else
        error "Failed to update DNS records"
        return 1
    fi
}

# Function to start infrastructure
start_infrastructure() {
    log "Starting CKA Simulator infrastructure..."
    
    # Start instances
    log "Starting EC2 instances..."
    aws ec2 start-instances \
        --instance-ids "$SSH_PROXY_INSTANCE" "$MASTER_INSTANCE" "$WORKER_INSTANCE" \
        --region "$REGION" > /dev/null
    
    if [ $? -eq 0 ]; then
        success "Instance start command sent successfully"
    else
        error "Failed to start instances"
        return 1
    fi
    
    # Wait for instances to be running
    if ! wait_for_instances "running"; then
        return 1
    fi
    
    # Update DNS records
    if ! update_dns_records; then
        return 1
    fi
    
    success "Infrastructure started successfully!"
    log "You can now access:"
    log "  Frontend: https://cka-simulator-b9l2n6wrb-jeffrey-xus-projects-8e6cab13.vercel.app"
    log "  SSH Proxy: https://ssh-proxy.ciscloudlab.link:3001"
    log "  Master Node: ssh ubuntu@master01.ciscloudlab.link"
    log "  Worker Node: ssh ubuntu@worker01.ciscloudlab.link"
}

# Function to stop infrastructure
stop_infrastructure() {
    log "Stopping CKA Simulator infrastructure..."
    
    # Stop instances
    log "Stopping EC2 instances..."
    aws ec2 stop-instances \
        --instance-ids "$SSH_PROXY_INSTANCE" "$MASTER_INSTANCE" "$WORKER_INSTANCE" \
        --region "$REGION" > /dev/null
    
    if [ $? -eq 0 ]; then
        success "Instance stop command sent successfully"
    else
        error "Failed to stop instances"
        return 1
    fi
    
    # Wait for instances to be stopped
    if ! wait_for_instances "stopped"; then
        return 1
    fi
    
    success "Infrastructure stopped successfully!"
    log "Monthly cost reduced from ~$75 to ~$5 (storage only)"
}

# Function to show status
show_status() {
    log "CKA Simulator Infrastructure Status"
    echo
    
    # Instance status
    local proxy_status=$(get_instance_status "$SSH_PROXY_INSTANCE")
    local master_status=$(get_instance_status "$MASTER_INSTANCE")
    local worker_status=$(get_instance_status "$WORKER_INSTANCE")
    
    printf "%-15s %-20s %-15s %-15s\n" "Instance" "ID" "Status" "Public IP"
    printf "%-15s %-20s %-15s %-15s\n" "--------" "--" "------" "---------"
    
    local proxy_ip=$(get_instance_ip "$SSH_PROXY_INSTANCE")
    local master_ip=$(get_instance_ip "$MASTER_INSTANCE")
    local worker_ip=$(get_instance_ip "$WORKER_INSTANCE")
    
    printf "%-15s %-20s %-15s %-15s\n" "ssh-proxy" "$SSH_PROXY_INSTANCE" "$proxy_status" "$proxy_ip"
    printf "%-15s %-20s %-15s %-15s\n" "master01" "$MASTER_INSTANCE" "$master_status" "$master_ip"
    printf "%-15s %-20s %-15s %-15s\n" "worker01" "$WORKER_INSTANCE" "$worker_status" "$worker_ip"
    
    echo
    
    # DNS status
    if [ "$proxy_status" = "running" ]; then
        log "DNS Records (ciscloudlab.link):"
        log "  ssh-proxy.ciscloudlab.link → $proxy_ip"
        log "  master01.ciscloudlab.link  → $master_ip"
        log "  worker01.ciscloudlab.link  → $worker_ip"
        echo
        log "Application URLs:"
        log "  Frontend: https://cka-simulator-b9l2n6wrb-jeffrey-xus-projects-8e6cab13.vercel.app"
        log "  SSH Proxy Health: https://ssh-proxy.ciscloudlab.link:3001/health"
    else
        warning "Instances are not running. DNS records may be outdated."
    fi
}

# Function to restart infrastructure
restart_infrastructure() {
    log "Restarting CKA Simulator infrastructure..."
    
    if ! stop_infrastructure; then
        error "Failed to stop infrastructure"
        return 1
    fi
    
    log "Waiting 30 seconds before starting..."
    sleep 30
    
    if ! start_infrastructure; then
        error "Failed to start infrastructure"
        return 1
    fi
    
    success "Infrastructure restarted successfully!"
}

# Function to show help
show_help() {
    echo "CKA Simulator Infrastructure Manager"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start     Start all EC2 instances and update DNS records"
    echo "  stop      Stop all EC2 instances to save costs"
    echo "  restart   Stop and start all instances with DNS update"
    echo "  status    Show current status of all instances and DNS"
    echo "  dns       Update DNS records with current IP addresses"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start    # Start infrastructure for development"
    echo "  $0 stop     # Stop infrastructure to save costs"
    echo "  $0 status   # Check current status"
    echo
    echo "Infrastructure Details:"
    echo "  SSH Proxy:  $SSH_PROXY_INSTANCE (ssh-proxy.ciscloudlab.link)"
    echo "  Master:     $MASTER_INSTANCE (master01.ciscloudlab.link)"
    echo "  Worker:     $WORKER_INSTANCE (worker01.ciscloudlab.link)"
    echo "  DNS Zone:   $HOSTED_ZONE_ID (ciscloudlab.link)"
    echo "  Region:     $REGION"
}

# Main script logic
main() {
    # Check AWS CLI
    check_aws_cli
    
    case "${1:-help}" in
        start)
            start_infrastructure
            ;;
        stop)
            stop_infrastructure
            ;;
        restart)
            restart_infrastructure
            ;;
        status)
            show_status
            ;;
        dns)
            update_dns_records
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"