#!/usr/bin/env node

// Simple WebSocket connection test for CKA Simulator
const WebSocket = require('ws');

const wsUrl = 'wss://ssh-proxy.ciscloudlab.link:3001';
const sessionId = `test-${Date.now()}`;

console.log('🔗 Testing WebSocket connection to:', wsUrl);
console.log('📋 Session ID:', sessionId);
console.log('');

const ws = new WebSocket(wsUrl, {
  rejectUnauthorized: false // Accept self-signed certificates for testing
});

let heartbeatInterval;
let connected = false;

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  connected = true;
  
  // Send initialization message
  ws.send(JSON.stringify({
    type: 'init',
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    keepAlive: true
  }));
  
  // Start heartbeat
  heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('💓 Sending heartbeat...');
      ws.send(JSON.stringify({
        type: 'ping',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));
    }
  }, 30000);
  
  // Send a test command after 2 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('🧪 Sending test command: kubectl get nodes');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'kubectl get nodes',
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        keepSession: true
      }));
    }
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received:', message.type, message.data ? `- ${message.data.substring(0, 100)}${message.data.length > 100 ? '...' : ''}` : '');
    
    if (message.type === 'pong') {
      console.log('💓 Heartbeat acknowledged');
    }
  } catch (error) {
    console.log('📨 Received (raw):', data.toString().substring(0, 200));
  }
});

ws.on('close', (code, reason) => {
  console.log('❌ WebSocket closed:', code, reason.toString());
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  if (connected) {
    console.log('🔄 Connection was established but then closed');
  }
});

ws.on('error', (error) => {
  console.error('💥 WebSocket error:', error.message);
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
});

// Auto-close after 60 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - closing connection');
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  ws.close(1000, 'Test completed');
  process.exit(0);
}, 60000);

console.log('⏳ Connecting...');
