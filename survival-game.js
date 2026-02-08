
const RELAY_SERVER = 'wss://relayfah.onrender.com';
const ROOM_ID = 'survival_world';
const WORLD_SIZE = 6000; // 3x bigger
const TILE_SIZE = 40;
const SWING_CHARGE_TIME = 2000;
const PLAYER_SPEED = 5;
const ATTACK_RANGE = 60;
const SPAWN_SIZE = 5; // 5x5 tile protected spawn

let relay, userProfile, canvas, ctx;
let myPlayerId, myPlayerData;
let players = new Map();
let buildings = new Map();

// Player state
let keys = {};
let health = 100;
let inventory = { wood: 20, stone: 10 }; // Fixed starting resources
let meterCharge = 0;
let isCharging = false;
let chargeInterval = null;

// Camera
let cameraX = 0, cameraY = 0;

// Hotbar
let selectedSlot = 0; // 0=axe, 1=wood wall, 2=stone wall, 3=floor
let buildPreview = null;

// Initialize
function init() {
    loadUserProfile();
    setupCanvas();
    setupControls();
    connectToServer();
}

function loadUserProfile() {
    try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            userProfile = JSON.parse(stored);
            if (!userProfile.username) {
                userProfile.username = 'Player' + Math.floor(Math.random() * 10000);
            }
            if (!userProfile.permanentId) {
                userProfile.permanentId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
            }
        } else {
            userProfile = {
                username: 'Player' + Math.floor(Math.random() * 10000),
                permanentId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
    } catch(e) {
        userProfile = {
            username: 'Player' + Math.floor(Math.random() * 10000),
            permanentId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
    }
    
    myPlayerId = userProfile.permanentId;
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // Number keys for hotbar
        if (e.key >= '1' && e.key <= '4') {
            selectSlot(parseInt(e.key) - 1);
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
}

function selectSlot(slot) {
    selectedSlot = slot;
    
    // Update UI
    document.querySelectorAll('.hotbar-slot').forEach((el, idx) => {
        if (idx === slot) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Make selectSlot globally accessible
window.selectSlot = selectSlot;

async function connectToServer() {
    try {
        relay = new RelayClient(RELAY_SERVER);
        await relay.connect();
        
        const cosmetics = userProfile.gladiatorCosmetics || { icon: '⚔️', slashColor: '#ffffff' };
        
        relay.joinRoom(ROOM_ID, userProfile.username, userProfile.status || 'player', myPlayerId, cosmetics);
        
        relay.on('joined', (data) => {
            console.log('Joined survival world!', data);
            
            if (data.worldState && data.worldState.buildings) {
                data.worldState.buildings.forEach(b => {
                    buildings.set(b.id, b);
                });
            }
            
            // DON'T add other players here - they'll broadcast their position via heartbeat
            
            myPlayerData = {
                id: myPlayerId,
                username: userProfile.username,
                x: WORLD_SIZE / 2,
                y: WORLD_SIZE / 2,
                health: health,
                inventory: inventory,
                icon: userProfile.gladiatorCosmetics?.icon || '⚔️',
                color: userProfile.gladiatorCosmetics?.slashColor || '#ffffff'
            };
            
            updatePlayerList();
            startGameLoop();
        });
        
        relay.on('player_joined', (data) => {
            // Don't add them yet - wait for their first heartbeat with position data
            console.log('Player joined:', data.player.username);
            updatePlayerList();
        });
        
        relay.on('player_left', (data) => {
            players.delete(data.player.permanentId);
            updatePlayerList();
        });
        
        relay.on('player_action', (data) => {
            handlePlayerAction(data);
        });
        
        startHeartbeat();
        
    } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect to server');
    }
}

function isInSpawn(x, y) {
    const spawnX = WORLD_SIZE / 2;
    const spawnY = WORLD_SIZE / 2;
    const spawnRadius = (SPAWN_SIZE * TILE_SIZE) / 2;
    
    return Math.abs(x - spawnX) < spawnRadius && Math.abs(y - spawnY) < spawnRadius;
}

function startHeartbeat() {
    setInterval(() => {
        if (relay && relay.connected && myPlayerData) {
            relay.sendPlayerAction('player_update', {
                x: myPlayerData.x,
                y: myPlayerData.y,
                health: health, // Use the global health variable that gets updated
                inventory: myPlayerData.inventory
            });
        }
    }, 100);
}

function handlePlayerAction(data) {
    const { action, playerId, actionData } = data;
    
    if (playerId === myPlayerId) return;
    
    switch (action) {
        case 'player_update':
            updateOtherPlayer(playerId, actionData);
            break;
        case 'build':
            handleRemoteBuild(actionData);
            break;
        case 'damage_building':
            handleBuildingDamage(actionData);
            break;
        case 'attack_player':
            handlePlayerAttack(playerId, actionData);
            break;
    }
}

function updateOtherPlayer(playerId, data) {
    if (!players.has(playerId)) {
        players.set(playerId, {
            id: playerId,
            username: data.username || 'Unknown',
            x: data.x,
            y: data.y,
            health: data.health || 100,
            icon: data.icon || '⚔️',
            color: data.color || '#ffffff'
        });
    } else {
        const player = players.get(playerId);
        player.x = data.x;
        player.y = data.y;
        player.health = data.health;
        // Update name/cosmetics if they changed
        if (data.username) player.username = data.username;
        if (data.icon) player.icon = data.icon;
        if (data.color) player.color = data.color;
    }
}

function startGameLoop() {
    requestAnimationFrame(gameLoop);
    startCharging();
}

function gameLoop() {
    if (!myPlayerData) return;
    
    // Move player
    let dx = 0, dy = 0;
    if (keys['w']) dy -= PLAYER_SPEED;
    if (keys['s']) dy += PLAYER_SPEED;
    if (keys['a']) dx -= PLAYER_SPEED;
    if (keys['d']) dx += PLAYER_SPEED;
    
    if (dx !== 0 || dy !== 0) {
        const newX = Math.max(0, Math.min(WORLD_SIZE, myPlayerData.x + dx));
        const newY = Math.max(0, Math.min(WORLD_SIZE, myPlayerData.y + dy));
        
        // Check collision with buildings - using AABB collision
        let canMove = true;
        const playerRadius = 15; // Player is 15px radius circle
        
        for (const building of buildings.values()) {
            // Skip floors - you can walk over them
            if (building.type.includes('floor')) continue;
            
            // AABB collision for walls
            const buildLeft = building.x;
            const buildRight = building.x + TILE_SIZE;
            const buildTop = building.y;
            const buildBottom = building.y + TILE_SIZE;
            
            const playerLeft = newX - playerRadius;
            const playerRight = newX + playerRadius;
            const playerTop = newY - playerRadius;
            const playerBottom = newY + playerRadius;
            
            if (playerRight > buildLeft && 
                playerLeft < buildRight && 
                playerBottom > buildTop && 
                playerTop < buildBottom) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            myPlayerData.x = newX;
            myPlayerData.y = newY;
        }
    }
    
    // Update camera
    cameraX = myPlayerData.x - canvas.width / 2;
    cameraY = myPlayerData.y - canvas.height / 2;
    
    render();
    requestAnimationFrame(gameLoop);
}

function startCharging() {
    chargeInterval = setInterval(() => {
        if (selectedSlot === 0 && meterCharge < 100) { // Only charge if axe is selected
            meterCharge += (100 / (SWING_CHARGE_TIME / 50));
            if (meterCharge > 100) meterCharge = 100;
            document.getElementById('meterFill').style.width = meterCharge + '%';
        }
    }, 50);
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseWorldX = e.clientX - rect.left + cameraX;
    const mouseWorldY = e.clientY - rect.top + cameraY;
    
    // Building mode (slots 1-3)
    if (selectedSlot >= 1 && selectedSlot <= 3) {
        placeBuild(mouseWorldX, mouseWorldY);
        return;
    }
    
    // Attack mode (slot 0 - axe)
    if (selectedSlot === 0) {
        const distance = Math.sqrt(
            Math.pow(mouseWorldX - myPlayerData.x, 2) + 
            Math.pow(mouseWorldY - myPlayerData.y, 2)
        );
        
        if (distance > ATTACK_RANGE) {
            meterCharge = 0;
            document.getElementById('meterFill').style.width = '0%';
            return;
        }
        
        const damage = Math.floor((meterCharge / 100) * 25);
        
        // Check if hitting building
        for (const building of buildings.values()) {
            if (checkCollision(mouseWorldX, mouseWorldY, 10, building.x, building.y, TILE_SIZE)) {
                damageBuilding(building.id, damage);
                meterCharge = 0;
                document.getElementById('meterFill').style.width = '0%';
                return;
            }
        }
        
        // Check if hitting player
        for (const player of players.values()) {
            if (checkCollision(mouseWorldX, mouseWorldY, 10, player.x, player.y, 20)) {
                attackPlayer(player.id, damage);
                meterCharge = 0;
                document.getElementById('meterFill').style.width = '0%';
                return;
            }
        }
        
        meterCharge = 0;
        document.getElementById('meterFill').style.width = '0%';
    }
}

function handleMouseMove(e) {
    if (selectedSlot >= 1 && selectedSlot <= 3) {
        const rect = canvas.getBoundingClientRect();
        const mouseWorldX = e.clientX - rect.left + cameraX;
        const mouseWorldY = e.clientY - rect.top + cameraY;
        
        buildPreview = {
            x: Math.floor(mouseWorldX / TILE_SIZE) * TILE_SIZE,
            y: Math.floor(mouseWorldY / TILE_SIZE) * TILE_SIZE
        };
    } else {
        buildPreview = null;
    }
}

function placeBuild(worldX, worldY) {
    if (!buildPreview) return;
    
    const x = buildPreview.x;
    const y = buildPreview.y;
    
    // Check if in spawn
    if (isInSpawn(x, y)) {
        return; // Silently fail
    }
    
    const buildTypes = ['axe', 'wood_wall', 'stone_wall', 'wood_floor'];
    const buildType = buildTypes[selectedSlot];
    
    const costs = {
        wood_wall: { wood: 5 },
        stone_wall: { stone: 8 },
        wood_floor: { wood: 3 }
    };
    
    const cost = costs[buildType];
    if (!cost) return;
    
    // Check resources
    for (const [resource, amount] of Object.entries(cost)) {
        if (inventory[resource] < amount) {
            return; // Silently fail
        }
    }
    
    // Check collision
    for (const building of buildings.values()) {
        if (Math.abs(building.x - x) < TILE_SIZE && Math.abs(building.y - y) < TILE_SIZE) {
            return; // Silently fail
        }
    }
    
    // Deduct resources
    for (const [resource, amount] of Object.entries(cost)) {
        inventory[resource] -= amount;
    }
    
    // Create building
    const buildingId = 'building_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const building = {
        id: buildingId,
        type: buildType,
        x: x,
        y: y,
        health: buildType.includes('stone') ? 100 : 60,
        maxHealth: buildType.includes('stone') ? 100 : 60,
        owner: myPlayerId
    };
    
    buildings.set(buildingId, building);
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('build', building);
    }
    
    updateInventoryUI();
}

function damageBuilding(buildingId, damage) {
    const building = buildings.get(buildingId);
    if (!building) return;
    
    building.health -= damage;
    
    const destroyed = building.health <= 0;
    
    if (destroyed) {
        buildings.delete(buildingId);
    }
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('damage_building', {
            buildingId: buildingId,
            damage: damage,
            destroyed: destroyed
        });
    }
}

function attackPlayer(targetId, damage) {
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('attack_player', {
            targetId: targetId,
            damage: damage
        });
    }
}

function handleRemoteBuild(buildingData) {
    buildings.set(buildingData.id, buildingData);
}

function handleBuildingDamage(data) {
    const building = buildings.get(data.buildingId);
    if (!building) return;
    
    building.health -= data.damage;
    
    if (data.destroyed) {
        buildings.delete(data.buildingId);
    }
}

function handlePlayerAttack(attackerId, data) {
    if (data.targetId === myPlayerId) {
        health = Math.max(0, health - data.damage);
        myPlayerData.health = health;
        document.getElementById('healthValue').textContent = health;
        
        // Visual damage effect
        canvas.style.filter = 'brightness(0.5)';
        setTimeout(() => {
            canvas.style.filter = 'brightness(1)';
        }, 100);
        
        if (health <= 0) {
            setTimeout(() => {
                alert('You died! Respawning...');
                respawn();
            }, 500);
        }
    } else {
        // Update other player's health
        const player = players.get(data.targetId);
        if (player) {
            player.health = Math.max(0, player.health - data.damage);
        }
    }
}

function respawn() {
    health = 100;
    myPlayerData.health = 100;
    myPlayerData.x = WORLD_SIZE / 2;
    myPlayerData.y = WORLD_SIZE / 2;
    inventory = { wood: 20, stone: 10 }; // Fixed respawn resources
    updateInventoryUI();
    document.getElementById('healthValue').textContent = 100;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid for reference
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    ctx.lineWidth = 1;
    
    const startX = Math.floor(cameraX / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(cameraY / TILE_SIZE) * TILE_SIZE;
    
    for (let x = startX; x < cameraX + canvas.width; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x - cameraX, 0);
        ctx.lineTo(x - cameraX, canvas.height);
        ctx.stroke();
    }
    
    for (let y = startY; y < cameraY + canvas.height; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y - cameraY);
        ctx.lineTo(canvas.width, y - cameraY);
        ctx.stroke();
    }
    
    // Draw spawn area
    ctx.fillStyle = 'rgba(100, 200, 100, 0.1)';
    ctx.strokeStyle = 'rgba(100, 200, 100, 0.5)';
    ctx.lineWidth = 2;
    const spawnScreenX = WORLD_SIZE / 2 - cameraX;
    const spawnScreenY = WORLD_SIZE / 2 - cameraY;
    const spawnPixelSize = SPAWN_SIZE * TILE_SIZE;
    ctx.fillRect(
        spawnScreenX - spawnPixelSize / 2,
        spawnScreenY - spawnPixelSize / 2,
        spawnPixelSize,
        spawnPixelSize
    );
    ctx.strokeRect(
        spawnScreenX - spawnPixelSize / 2,
        spawnScreenY - spawnPixelSize / 2,
        spawnPixelSize,
        spawnPixelSize
    );
    
    // Draw buildings
    for (const building of buildings.values()) {
        const screenX = building.x - cameraX;
        const screenY = building.y - cameraY;
        
        if (building.type.includes('wall')) {
            ctx.fillStyle = building.type.includes('stone') ? '#78716c' : '#92400e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else if (building.type.includes('floor')) {
            ctx.fillStyle = '#854d0e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
        
        // Health bar
        const healthPercent = building.health / building.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 8, TILE_SIZE, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(screenX, screenY - 8, TILE_SIZE * healthPercent, 5);
    }
    
    // Draw other players
    for (const player of players.values()) {
        const screenX = player.x - cameraX;
        const screenY = player.y - cameraY;
        
        ctx.fillStyle = player.color || '#ef4444';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.icon, screenX, screenY);
        
        // Username
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(player.username, screenX, screenY - 30);
        ctx.fillText(player.username, screenX, screenY - 30);
        
        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 25, screenY - 40, 50, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(screenX - 25, screenY - 40, 50 * (player.health / 100), 5);
    }
    
    // Draw my player
    const myScreenX = myPlayerData.x - cameraX;
    const myScreenY = myPlayerData.y - cameraY;
    
    const myColor = userProfile.gladiatorCosmetics?.slashColor || '#3b82f6';
    ctx.fillStyle = myColor;
    ctx.beginPath();
    ctx.arc(myScreenX, myScreenY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    const myIcon = userProfile.gladiatorCosmetics?.icon || '⚔️';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(myIcon, myScreenX, myScreenY);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(userProfile.username + ' (YOU)', myScreenX, myScreenY - 30);
    ctx.fillText(userProfile.username + ' (YOU)', myScreenX, myScreenY - 30);
    
    // Build preview
    if (buildPreview && selectedSlot >= 1) {
        const previewX = buildPreview.x - cameraX;
        const previewY = buildPreview.y - cameraY;
        
        const canPlace = !isInSpawn(buildPreview.x, buildPreview.y);
        
        ctx.fillStyle = canPlace ? 'rgba(100, 200, 100, 0.3)' : 'rgba(200, 100, 100, 0.3)';
        ctx.fillRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = canPlace ? '#4ade80' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
    }
    
    // Show swing meter if axe selected
    if (selectedSlot === 0) {
        document.getElementById('swingMeter').style.display = 'block';
    } else {
        document.getElementById('swingMeter').style.display = 'none';
    }
}

function checkCollision(x1, y1, size1, x2, y2, size2) {
    return Math.abs(x1 - x2) < (size1 + size2) / 2 &&
           Math.abs(y1 - y2) < (size1 + size2) / 2;
}

function updateInventoryUI() {
    document.getElementById('woodCount').textContent = inventory.wood || 0;
    document.getElementById('stoneCount').textContent = inventory.stone || 0;
}

function updatePlayerList() {
    const list = document.getElementById('playersListContent');
    list.innerHTML = '';
    
    // Add yourself
    const myEntry = document.createElement('div');
    myEntry.className = 'player-entry';
    myEntry.textContent = userProfile.username + ' (You)';
    myEntry.style.color = '#4ade80';
    list.appendChild(myEntry);
    
    // Add others
    for (const player of players.values()) {
        const entry = document.createElement('div');
        entry.className = 'player-entry';
        entry.textContent = player.username;
        list.appendChild(entry);
    }
    
    document.getElementById('playerCount').textContent = players.size + 1;
}

// Start game
init();
