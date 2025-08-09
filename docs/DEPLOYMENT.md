# 🚀 Deployment Guide

## Infrastructure Overview

The CKA Simulator requires three main components:

1. **Vercel Frontend** - Static hosting for the React application
2. **AWS EC2 SSH Proxy** - WebSocket server for terminal communication
3. **AWS Kubernetes Cluster** - Real cluster for kubectl command execution

## AWS Infrastructure Setup

### 1. Create Kubernetes Cluster

```bash
# Create master node
aws ec2 run-instances \
  --image-id ami-021589336d307b577 \
  --instance-type t3.medium \
  --key-name your-key-name \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=master01}]'

# Create worker node
aws ec2 run-instances \
  --image-id ami-021589336d307b577 \
  --instance-type t3.medium \
  --key-name your-key-name \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=worker01}]'
```

### 2. Install Kubernetes

```bash
# On both nodes
sudo apt update
sudo apt install -y containerd kubelet kubeadm kubectl

# On master node
sudo kubeadm init --pod-network-cidr=192.168.0.0/16

# Install CNI (Calico)
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Join worker node (use token from kubeadm init output)
sudo kubeadm join master-ip:6443 --token <token> --discovery-token-ca-cert-hash <hash>
```

### 3. Create SSH Proxy Server

```bash
# Create t3.micro instance
aws ec2 run-instances \
  --image-id ami-021589336d307b577 \
  --instance-type t3.micro \
  --key-name your-key-name \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ssh-proxy}]'

# Install Node.js and dependencies
ssh -i your-key.pem ubuntu@proxy-ip
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## SSL Certificate Setup

### Self-Signed Certificate (Development)

```bash
# On SSH proxy server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj '/C=US/ST=State/L=City/O=Organization/CN=your-server-ip'
```

### Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install certbot

# Get certificate (requires domain)
sudo certbot certonly --standalone -d your-domain.com

# Update server to use certificates
# key: /etc/letsencrypt/live/your-domain.com/privkey.pem
# cert: /etc/letsencrypt/live/your-domain.com/fullchain.pem
```

## Frontend Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_WS_URL
```

### Manual Deployment

```bash
# Build application
npm run build

# Deploy to your hosting provider
npm run start
```

## Configuration Updates

### Update IP Addresses

When EC2 instances restart, IP addresses may change. Update these files:

1. **Frontend WebSocket URL**:
   ```typescript
   // src/components/terminal/XTermComponent.tsx
   const wsUrl = 'wss://NEW-PROXY-IP:3001'
   ```

2. **SSH Proxy Configuration**:
   ```javascript
   // ssh-proxy-server/.env
   K8S_MASTER_IP=NEW-MASTER-IP
   ```

3. **SSL Certificate**:
   ```bash
   # Regenerate with new IP
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
     -subj '/C=US/ST=State/L=City/O=Organization/CN=NEW-PROXY-IP'
   ```

## Security Groups

### Required Ports

```bash
# SSH access
Port 22 - Source: 0.0.0.0/0

# Kubernetes API
Port 6443 - Source: 0.0.0.0/0

# WebSocket proxy
Port 3001 - Source: 0.0.0.0/0

# NodePort services
Port 30000-32767 - Source: 0.0.0.0/0

# Inter-node communication
All traffic - Source: VPC CIDR (172.31.0.0/16)
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check SSH proxy
curl -k https://proxy-ip:3001/health

# Check Kubernetes cluster
kubectl get nodes
kubectl get pods -A

# Check WebSocket connection
# Use browser developer tools to monitor WebSocket traffic
```

### Log Monitoring

```bash
# SSH proxy logs
tail -f ~/ssh-proxy-server/server.log

# Kubernetes logs
journalctl -u kubelet -f

# System logs
tail -f /var/log/syslog
```

## Backup and Recovery

### Backup Kubernetes Configuration

```bash
# Backup kubeconfig
cp ~/.kube/config ~/.kube/config.backup

# Backup etcd (on master)
sudo ETCDCTL_API=3 etcdctl snapshot save backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### Disaster Recovery

```bash
# Restore cluster from backup
sudo kubeadm reset
sudo kubeadm init --ignore-preflight-errors=DirAvailable--var-lib-etcd

# Restore etcd snapshot
sudo ETCDCTL_API=3 etcdctl snapshot restore backup.db
```

## Cost Optimization

### Stop Instances When Not in Use

```bash
# Stop all instances
aws ec2 stop-instances --instance-ids i-master i-worker i-proxy

# Start instances
aws ec2 start-instances --instance-ids i-master i-worker i-proxy

# Get new IP addresses
aws ec2 describe-instances --instance-ids i-master i-worker i-proxy \
  --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`].Value|[0],PublicIP:PublicIpAddress}'
```

### Use Spot Instances

```bash
# Create spot instance request
aws ec2 request-spot-instances \
  --spot-price "0.05" \
  --instance-count 1 \
  --type "one-time" \
  --launch-specification file://spot-specification.json
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check security group allows port 3001
   - Verify SSL certificate is accepted
   - Confirm SSH proxy server is running

2. **kubectl Commands Not Working**
   - Check SSH connectivity to master node
   - Verify kubeconfig is properly set up
   - Ensure cluster nodes are in Ready state

3. **SSL Certificate Errors**
   - Regenerate certificate with correct IP address
   - Clear browser cache and cookies
   - Check certificate file permissions

### Debug Commands

```bash
# Test SSH connectivity
ssh -i your-key.pem ubuntu@master-ip "kubectl get nodes"

# Test WebSocket server
curl -k -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  https://proxy-ip:3001/

# Check process status
ps aux | grep node
ss -tlnp | grep 3001
```