// survival-game.js - Main game logic for shared world survival game

const RELAY_SERVER = 'wss://relayfah.onrender.com';
const ROOM_ID = 'survival_world';
const WORLD_SIZE = 500;
const TILE_SIZE = 20;
const SWING_CHARGE_TIME = 2000;
const PLAYER_SPEED = 3;
const ATTACK_RANGE = 40;
const SPAWN_SIZE = 10; // 10x10 protected spawn

let relay, userProfile, canvas, ctx;
let myPlayerId, myPlayerData;
let world = null;
let players = new Map();
let buildings = new Map();
let resources = new Map();

// Player state
let keys = {};
let health = 100;
let inventory = { wood: 20, stone: 10 };
let meterCharge = 0;
let isCharging = false;
let chargeInterval = null;

// Camera
let cameraX = 0, cameraY = 0;

// Building mode
let buildMode = false;
let selectedBuildType = null;
let buildPreview = null;

// Trade
let tradeRequests = [];

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
        
        if (e.key.toLowerCase() === 'b') {
            toggleBuildMenu();
        }
        
        if (e.key.toLowerCase() === 't') {
            toggleTradeCenter();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Build menu options
    document.querySelectorAll('.build-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.build-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedBuildType = opt.dataset.type;
        });
    });
}

async function connectToServer() {
    try {
        relay = new RelayClient(RELAY_SERVER);
        await relay.connect();
        
        const cosmetics = userProfile.gladiatorCosmetics || { icon: '⚔️', slashColor: '#ffffff' };
        
        relay.joinRoom(ROOM_ID, userProfile.username, userProfile.status || 'player', myPlayerId, cosmetics);
        
        relay.on('joined', (data) => {
            console.log('Joined survival world!', data);
            
            if (data.worldState) {
                world = data.worldState;
                loadWorldState(world);
            }
            
            if (data.players) {
                data.players.forEach(p => {
                    if (p.permanentId !== myPlayerId) {
                        players.set(p.permanentId, {
                            id: p.permanentId,
                            username: p.username,
                            x: p.x || 250,
                            y: p.y || 250,
                            health: p.health || 100,
                            icon: p.gladiatorCosmetics?.icon || '⚔️',
                            color: p.gladiatorCosmetics?.slashColor || '#ffffff'
                        });
                    }
                });
            }
            
            myPlayerData = {
                id: myPlayerId,
                username: userProfile.username,
                x: 250,
                y: 250,
                health: health,
                inventory: inventory
            };
            
            updatePlayerList();
            startGameLoop();
        });
        
        relay.on('player_joined', (data) => {
            console.log('Player joined:', data.player);
            if (data.player.permanentId !== myPlayerId) {
                players.set(data.player.permanentId, {
                    id: data.player.permanentId,
                    username: data.player.username,
                    x: 250,
                    y: 250,
                    health: 100,
                    icon: data.player.gladiatorCosmetics?.icon || '⚔️',
                    color: data.player.gladiatorCosmetics?.slashColor || '#ffffff'
                });
            }
            updatePlayerList();
        });
        
        relay.on('player_left', (data) => {
            players.delete(data.player.permanentId);
            updatePlayerList();
        });
        
        relay.on('player_action', (data) => {
            handlePlayerAction(data);
        });
        
        relay.on('world_update', (data) => {
            handleWorldUpdate(data);
        });
        
        startHeartbeat();
        
    } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect to server');
    }
}

function loadWorldState(worldData) {
    // Load buildings
    if (worldData.buildings) {
        worldData.buildings.forEach(b => {
            buildings.set(b.id, b);
        });
    }
    
    // Load resources
    if (worldData.resources) {
        worldData.resources.forEach(r => {
            resources.set(r.id, r);
        });
    } else {
        // Generate initial resources if world is new
        generateInitialResources();
    }
}

function generateInitialResources() {
    // Generate trees
    for (let i = 0; i < 50; i++) {
        let x, y;
        do {
            x = Math.random() * WORLD_SIZE;
            y = Math.random() * WORLD_SIZE;
        } while (isInSpawn(x, y));
        
        const id = 'tree_' + Date.now() + '_' + i;
        resources.set(id, {
            id: id,
            type: 'tree',
            x: x,
            y: y,
            health: 50
        });
    }
    
    // Generate stone nodes
    for (let i = 0; i < 30; i++) {
        let x, y;
        do {
            x = Math.random() * WORLD_SIZE;
            y = Math.random() * WORLD_SIZE;
        } while (isInSpawn(x, y));
        
        const id = 'stone_' + Date.now() + '_' + i;
        resources.set(id, {
            id: id,
            type: 'stone',
            x: x,
            y: y,
            health: 80
        });
    }
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('init_resources', {
            resources: Array.from(resources.values())
        });
    }
}

function isInSpawn(x, y) {
    const spawnX = WORLD_SIZE / 2;
    const spawnY = WORLD_SIZE / 2;
    const spawnRadius = SPAWN_SIZE / 2;
    
    return Math.abs(x - spawnX) < spawnRadius && Math.abs(y - spawnY) < spawnRadius;
}

function startHeartbeat() {
    setInterval(() => {
        if (relay && relay.connected && myPlayerData) {
            relay.sendPlayerAction('player_update', {
                x: myPlayerData.x,
                y: myPlayerData.y,
                health: myPlayerData.health,
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
        case 'damage_resource':
            handleResourceDamage(actionData);
            break;
        case 'attack_player':
            handlePlayerAttack(actionData);
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
            health: data.health,
            icon: data.icon || '⚔️',
            color: data.color || '#ffffff'
        });
    } else {
        const player = players.get(playerId);
        player.x = data.x;
        player.y = data.y;
        player.health = data.health;
    }
}

function handleWorldUpdate(data) {
    if (data.buildings) {
        buildings.clear();
        data.buildings.forEach(b => buildings.set(b.id, b));
    }
    
    if (data.resources) {
        resources.clear();
        data.resources.forEach(r => resources.set(r.id, r));
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
        
        // Check collision with buildings
        let canMove = true;
        for (const building of buildings.values()) {
            if (checkCollision(newX, newY, 10, building.x, building.y, TILE_SIZE)) {
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
        if (meterCharge < 100) {
            meterCharge += (100 / (SWING_CHARGE_TIME / 50));
            if (meterCharge > 100) meterCharge = 100;
            document.getElementById('meterFill').style.width = meterCharge + '%';
        }
    }, 50);
}

function handleClick(e) {
    if (buildMode && selectedBuildType) {
        placeBuild(e);
        return;
    }
    
    // Attack
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + cameraX;
    const mouseY = e.clientY - rect.top + cameraY;
    
    const distance = Math.sqrt(
        Math.pow(mouseX - myPlayerData.x, 2) + 
        Math.pow(mouseY - myPlayerData.y, 2)
    );
    
    if (distance > ATTACK_RANGE) return;
    
    const damage = Math.floor((meterCharge / 100) * 25);
    
    // Check if hitting building
    for (const building of buildings.values()) {
        if (checkCollision(mouseX, mouseY, 5, building.x, building.y, TILE_SIZE)) {
            damageBuilding(building.id, damage);
            meterCharge = 0;
            document.getElementById('meterFill').style.width = '0%';
            return;
        }
    }
    
    // Check if hitting resource
    for (const resource of resources.values()) {
        if (checkCollision(mouseX, mouseY, 5, resource.x, resource.y, TILE_SIZE)) {
            damageResource(resource.id, damage);
            meterCharge = 0;
            document.getElementById('meterFill').style.width = '0%';
            return;
        }
    }
    
    // Check if hitting player
    for (const player of players.values()) {
        if (checkCollision(mouseX, mouseY, 5, player.x, player.y, 20)) {
            attackPlayer(player.id, damage);
            meterCharge = 0;
            document.getElementById('meterFill').style.width = '0%';
            return;
        }
    }
    
    meterCharge = 0;
    document.getElementById('meterFill').style.width = '0%';
}

function handleMouseMove(e) {
    if (buildMode && selectedBuildType) {
        const rect = canvas.getBoundingClientRect();
        buildPreview = {
            x: Math.floor((e.clientX - rect.left + cameraX) / TILE_SIZE) * TILE_SIZE,
            y: Math.floor((e.clientY - rect.top + cameraY) / TILE_SIZE) * TILE_SIZE
        };
    }
}

function placeBuild(e) {
    if (!buildPreview) return;
    
    // Check if in spawn
    if (isInSpawn(buildPreview.x, buildPreview.y)) {
        alert('Cannot build in spawn area!');
        return;
    }
    
    const costs = {
        wood_wall: { wood: 5 },
        stone_wall: { stone: 8 },
        wood_floor: { wood: 3 }
    };
    
    const cost = costs[selectedBuildType];
    if (!cost) return;
    
    // Check resources
    for (const [resource, amount] of Object.entries(cost)) {
        if (inventory[resource] < amount) {
            alert(`Not enough ${resource}!`);
            return;
        }
    }
    
    // Check collision
    for (const building of buildings.values()) {
        if (building.x === buildPreview.x && building.y === buildPreview.y) {
            alert('Space occupied!');
            return;
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
        type: selectedBuildType,
        x: buildPreview.x,
        y: buildPreview.y,
        health: selectedBuildType.includes('stone') ? 100 : 60,
        owner: myPlayerId
    };
    
    buildings.set(buildingId, building);
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('build', building);
    }
    
    updateInventoryUI();
    closeBuildMenu();
}

function damageBuilding(buildingId, damage) {
    const building = buildings.get(buildingId);
    if (!building) return;
    
    building.health -= damage;
    
    if (building.health <= 0) {
        buildings.delete(buildingId);
    }
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('damage_building', {
            buildingId: buildingId,
            damage: damage,
            destroyed: building.health <= 0
        });
    }
}

function damageResource(resourceId, damage) {
    const resource = resources.get(resourceId);
    if (!resource) return;
    
    resource.health -= damage;
    
    if (resource.health <= 0) {
        // Give resources
        const reward = resource.type === 'tree' ? { wood: 5 } : { stone: 8 };
        for (const [type, amount] of Object.entries(reward)) {
            inventory[type] = (inventory[type] || 0) + amount;
        }
        
        resources.delete(resourceId);
        updateInventoryUI();
    }
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('damage_resource', {
            resourceId: resourceId,
            damage: damage,
            destroyed: resource.health <= 0
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

function handleResourceDamage(data) {
    const resource = resources.get(data.resourceId);
    if (!resource) return;
    
    resource.health -= data.damage;
    
    if (data.destroyed) {
        resources.delete(data.resourceId);
    }
}

function handlePlayerAttack(data) {
    if (data.targetId === myPlayerId) {
        health = Math.max(0, health - data.damage);
        myPlayerData.health = health;
        document.getElementById('healthValue').textContent = health;
        
        if (health <= 0) {
            alert('You died! Respawning...');
            respawn();
        }
    }
}

function respawn() {
    health = 100;
    myPlayerData.health = 100;
    myPlayerData.x = 250;
    myPlayerData.y = 250;
    inventory = { wood: 20, stone: 10 };
    updateInventoryUI();
    document.getElementById('healthValue').textContent = 100;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw spawn area
    ctx.fillStyle = 'rgba(100, 200, 100, 0.1)';
    const spawnScreenX = WORLD_SIZE / 2 - cameraX;
    const spawnScreenY = WORLD_SIZE / 2 - cameraY;
    ctx.fillRect(
        spawnScreenX - (SPAWN_SIZE * TILE_SIZE) / 2,
        spawnScreenY - (SPAWN_SIZE * TILE_SIZE) / 2,
        SPAWN_SIZE * TILE_SIZE,
        SPAWN_SIZE * TILE_SIZE
    );
    
    // Draw resources
    for (const resource of resources.values()) {
        const screenX = resource.x - cameraX;
        const screenY = resource.y - cameraY;
        
        if (resource.type === 'tree') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#71717a';
            ctx.fillRect(screenX - 10, screenY - 10, 20, 20);
        }
    }
    
    // Draw buildings
    for (const building of buildings.values()) {
        const screenX = building.x - cameraX;
        const screenY = building.y - cameraY;
        
        if (building.type.includes('wall')) {
            ctx.fillStyle = building.type.includes('stone') ? '#78716c' : '#92400e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else if (building.type.includes('floor')) {
            ctx.fillStyle = '#854d0e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
        
        // Health bar
        const healthPercent = building.health / (building.type.includes('stone') ? 100 : 60);
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 8, TILE_SIZE, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(screenX, screenY - 8, TILE_SIZE * healthPercent, 4);
    }
    
    // Draw other players
    for (const player of players.values()) {
        const screenX = player.x - cameraX;
        const screenY = player.y - cameraY;
        
        ctx.fillStyle = player.color || '#ef4444';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.icon, screenX, screenY);
        
        // Username
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(player.username, screenX, screenY - 20);
        
        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 20, screenY - 30, 40, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(screenX - 20, screenY - 30, 40 * (player.health / 100), 4);
    }
    
    // Draw my player
    const myScreenX = myPlayerData.x - cameraX;
    const myScreenY = myPlayerData.y - cameraY;
    
    const myColor = userProfile.gladiatorCosmetics?.slashColor || '#3b82f6';
    ctx.fillStyle = myColor;
    ctx.beginPath();
    ctx.arc(myScreenX, myScreenY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    const myIcon = userProfile.gladiatorCosmetics?.icon || '⚔️';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(myIcon, myScreenX, myScreenY);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(userProfile.username + ' (YOU)', myScreenX, myScreenY - 20);
    
    // Build preview
    if (buildMode && buildPreview) {
        const previewX = buildPreview.x - cameraX;
        const previewY = buildPreview.y - cameraY;
        
        ctx.fillStyle = 'rgba(214, 158, 46, 0.5)';
        ctx.fillRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#d69e2e';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
    }
    
    // Show swing meter if charging
    if (meterCharge > 0) {
        document.getElementById('swingMeter').style.display = 'block';
    } else {
        document.getElementById('swingMeter').style.display = 'none';
    }
}

function checkCollision(x1, y1, size1, x2, y2, size2) {
    return Math.abs(x1 - x2) < (size1 + size2) / 2 &&
           Math.abs(y1 - y2) < (size1 + size2) / 2;
}

function toggleBuildMenu() {
    buildMode = !buildMode;
    const menu = document.getElementById('buildMenu');
    menu.style.display = buildMode ? 'block' : 'none';
    
    if (!buildMode) {
        selectedBuildType = null;
        buildPreview = null;
    }
}

function closeBuildMenu() {
    buildMode = false;
    selectedBuildType = null;
    buildPreview = null;
    document.getElementById('buildMenu').style.display = 'none';
}

function toggleTradeCenter() {
    const center = document.getElementById('tradeCenter');
    const isOpen = center.style.display === 'block';
    center.style.display = isOpen ? 'none' : 'block';
}

function closeTradeCenter() {
    document.getElementById('tradeCenter').style.display = 'none';
}

function createTrade() {
    const offerType = document.getElementById('offerType').value;
    const offerAmount = parseInt(document.getElementById('offerAmount').value);
    const requestType = document.getElementById('requestType').value;
    const requestAmount = parseInt(document.getElementById('requestAmount').value);
    
    if (!offerAmount || !requestAmount || offerAmount <= 0 || requestAmount <= 0) {
        alert('Invalid amounts!');
        return;
    }
    
    if (inventory[offerType] < offerAmount) {
        alert(`Not enough ${offerType}!`);
        return;
    }
    
    // Deduct offered resources
    inventory[offerType] -= offerAmount;
    updateInventoryUI();
    
    const trade = {
        id: 'trade_' + Date.now(),
        trader: userProfile.username,
        traderId: myPlayerId,
        offer: { type: offerType, amount: offerAmount },
        request: { type: requestType, amount: requestAmount }
    };
    
    tradeRequests.push(trade);
    
    // Send to server
    if (relay && relay.connected) {
        relay.sendPlayerAction('create_trade', trade);
    }
    
    alert('Trade posted!');
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
