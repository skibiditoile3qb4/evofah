class AdminPanel {
    constructor() {
        this.relay = null;
        this.userProfile = this.getUserProfile();
        this.initializeRelay();
        this.setupEventListeners();
    }

    getUserProfile() {
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch(e) {}
        return { status: 'player', username: 'guest' };
    }

    async initializeRelay() {
        try {
            const RELAY_SERVER = 'wss://relayfah.onrender.com';
            this.relay = new RelayClient(RELAY_SERVER);
            await this.relay.connect();
            
            // Join admin channel
            this.relay.joinRoom('admin_actions', this.userProfile.username, this.userProfile.status);
            
            // Listen for admin action confirmations
            this.relay.on('admin_action_result', (data) => {
                if (data.success) {
                    alert(`✅ ${data.message}`);
                } else {
                    alert(`❌ ${data.message}`);
                }
            });

            console.log('Admin panel connected to relay server');
        } catch (error) {
            console.error('Failed to connect admin panel:', error);
            alert('Failed to connect to server. Some features may not work.');
        }
    }

    setupEventListeners() {
        // OWNER: Promote/Demote
        const promoteBtn = document.getElementById('promoteBtn');
        if (promoteBtn) {
            promoteBtn.addEventListener('click', () => this.handlePromote());
        }

        // OWNER: Permanent Ban
        const permBanBtn = document.getElementById('permBanBtn');
        if (permBanBtn) {
            permBanBtn.addEventListener('click', () => this.handlePermBan());
        }

        // SR. ADMIN: Ban
        const srBanBtn = document.getElementById('srBanBtn');
        if (srBanBtn) {
            srBanBtn.addEventListener('click', () => this.handleSrBan());
        }

        // ADMIN: Ban
        const adminBanBtn = document.getElementById('adminBanBtn');
        if (adminBanBtn) {
            adminBanBtn.addEventListener('click', () => this.handleAdminBan());
        }

        // MODERATOR: Mute
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.handleMute());
        }

        // View Logs
        const viewLogsBtn = document.getElementById('viewLogsBtn');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => this.handleViewLogs());
        }
    }

    handlePromote() {
        const username = document.getElementById('promoteUsername').value.trim();
        const rank = document.getElementById('promoteRank').value;

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!confirm(`Set ${username}'s rank to ${rank}?`)) {
            return;
        }

        // Send to relay server
        this.relay.send({
            type: 'admin_action',
            action: 'promote',
            targetUsername: username,
            newRank: rank,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status
        });

        document.getElementById('promoteUsername').value = '';
    }

    handlePermBan() {
        const username = document.getElementById('permBanUsername').value.trim();
        const days = parseInt(document.getElementById('permBanDays').value) || 0;

        if (!username) {
            alert('Enter a username');
            return;
        }

        const banType = days === 0 ? 'PERMANENT' : `${days} days`;
        if (!confirm(`Ban ${username} for ${banType}?`)) {
            return;
        }

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            permanent: days === 0,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Owner ban'
        });

        document.getElementById('permBanUsername').value = '';
        document.getElementById('permBanDays').value = '';
    }

    handleSrBan() {
        const username = document.getElementById('srBanUsername').value.trim();
        const days = Math.min(parseInt(document.getElementById('srBanDays').value) || 1, 30);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!confirm(`Ban ${username} for ${days} days?`)) {
            return;
        }

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Sr. Admin ban',
            maxDays: 30
        });

        document.getElementById('srBanUsername').value = '';
        document.getElementById('srBanDays').value = '';
    }

    handleAdminBan() {
        const username = document.getElementById('adminBanUsername').value.trim();
        const days = Math.min(parseInt(document.getElementById('adminBanDays').value) || 1, 7);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!confirm(`Ban ${username} for ${days} days?`)) {
            return;
        }

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Admin ban',
            maxDays: 7
        });

        document.getElementById('adminBanUsername').value = '';
        document.getElementById('adminBanDays').value = '';
    }

    handleMute() {
        const username = document.getElementById('muteUsername').value.trim();
        const hours = Math.min(parseInt(document.getElementById('muteHours').value) || 1, 24);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!confirm(`Mute ${username} for ${hours} hours?`)) {
            return;
        }

        this.relay.send({
            type: 'admin_action',
            action: 'mute',
            targetUsername: username,
            hours: hours,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status
        });

        document.getElementById('muteUsername').value = '';
        document.getElementById('muteHours').value = '';
    }

    handleViewLogs() {
        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server');
            return;
        }

        this.relay.send({
            type: 'get_admin_logs',
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            limit: 50
        });

        // Listen for logs response
        this.relay.on('admin_logs', (data) => {
            this.displayLogs(data.logs);
        });
    }

    displayLogs(logs) {
        const logDisplay = document.getElementById('logDisplay');
        logDisplay.style.display = 'block';
        
        if (logs.length === 0) {
            logDisplay.innerHTML = '<p style="color: #888;">No recent admin actions.</p>';
            return;
        }

        let html = '<div style="font-size: 12px; color: #aaa;">';
        logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            html += `<div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
                <strong style="color: #d69e2e;">[${time}]</strong> 
                <span style="color: #fff;">${log.action}</span>
                ${log.details ? `<br><span style="color: #888;">${log.details}</span>` : ''}
            </div>`;
        });
        html += '</div>';
        
        logDisplay.innerHTML = html;
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    const staffRanks = ['owner', 'sr.admin', 'admin', 'moderator'];
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{"status":"player"}');
    
    if (staffRanks.includes(userProfile.status)) {
        new AdminPanel();
    }
});
