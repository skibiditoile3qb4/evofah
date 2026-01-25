// relay-client.js - Add this file to your static site

class RelayClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.clientId = null;
    this.room = null;
    this.username = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    
    // Event handlers
    this.handlers = {
      connected: [],
      disconnected: [],
      chat_message: [],
      player_joined: [],
      player_left: [],
      game_state_update: [],
      player_action: [],
      error: [],
      donation: [],
      kick: [],
      disband: [],
      players_update: [],
      banned: [],           // ✅ ADDED
      muted: [],            // ✅ ADDED
      rank_changed: [],     // ✅ ADDED
      admin_action_result: [], // ✅ ADDED
      admin_logs: []        // ✅ ADDED
    };
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
  console.log('Connected to relay server');
  this.connected = true;
  this.reconnectAttempts = 0;
  
onsole.log('starting heartbeat');
  this.startHeartbeat();
};
        
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            this.clientId = data.clientId;
            this.emit('connected', data);
            resolve(data);
          } else {
            this.handleMessage(data);
          }
        };
        
        this.ws.onclose = () => {
          console.log('Disconnected from relay server');
          this.connected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
        
      } catch (error) {
        console.error('Connection error:', error);
        reject(error);
      }
    });
  }
  startHeartbeat() {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
  }
  
  this.heartbeatInterval = setInterval(() => {
    if (this.connected && this.room) {
      this.send({ type: 'heartbeat' });
    }
  }, 1000); // Every 1 second
}
  stopHeartbeat() {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }
}
  
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {});
    }, this.reconnectDelay);
  }
  
  handleMessage(data) {
    // Emit event to handlers
    this.emit(data.type, data);
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }
  
  // Room Management
  joinRoom(room, username, status) {
    this.room = room;
    this.username = username;
    this.send({
      type: 'join',
      room,
      username,
      status: status || 'player'
    });
  }
  
  leaveRoom() {
    this.send({ type: 'leave' });
    this.room = null;
  }
  
  // Chat
  sendChat(message) {
    if (!this.room) {
      console.warn('Not in a room');
      return;
    }
    
    this.send({
      type: 'chat',
      message
    });
  }
  
  // Game State Sync
  sendGameState(state) {
    if (!this.room) {
      console.warn('Not in a room');
      return;
    }
    
    this.send({
      type: 'game_state',
      state
    });
  }
  
  sendPlayerAction(action, data = {}) {
    if (!this.room) {
      console.warn('Not in a room');
      return;
    }
    
    this.send({
      type: 'player_action',
      action,
      data
    });
  }
  
  // Logging
  getLogs(limit = 100) {
    this.send({
      type: 'get_logs',
      limit
    });
  }
  
  // Event System
  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
  }
  
  off(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    }
  }
  
  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler(data));
    }
  }
  
 disconnect() {
  this.stopHeartbeat();
  if (this.ws) {
    this.ws.close();
  }
}
}

// Export for use in your site
window.RelayClient = RelayClient;
