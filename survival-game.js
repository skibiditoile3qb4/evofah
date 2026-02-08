const RELAY_SERVER = 'wss://relayfah.onrender.com';
const ROOM_ID = 'survival_world';
const WORLD_SIZE = 6000;
const TILE_SIZE = 40;
const SWING_CHARGE_TIME = 2000;
const PLAYER_SPEED = 5;
const ATTACK_RANGE = 60;
const BUILD_RANGE = 150;
const SPAWN_SIZE = 5;
const PICKUP_RANGE = 50;
const MAX_RESOURCE_NODES = 16;
const RESOURCE_RESPAWN_DELAY = 30000; // 30 seconds after all nodes are gone

let relay, userProfile, canvas, ctx;
let myPlayerId, myPlayerData;
let players = new Map();
let buildings = new Map();
let drops = new Map();
let resourceNodes = new Map();
let hasLoadedFromDB = false;

// Player state
let keys = {};
let health = 100;
let inventory = { wood: 0, stone: 0 };
let meterCharge = 0;
let isCharging = false;
let chargeInterval = null;

// Camera
let cameraX = 0, cameraY = 0;

// Hotbar
let selectedSlot = 0;
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
        
        if (e.key >= '1' && e.key <= '4') {
            selectSlot(parseInt(e.key) - 1);
        }
        
        // E key to pickup nearby drops
        if (e.key.toLowerCase() === 'e') {
            tryPickupNearbyDrop();
        }
        
        // Q key to drop items
        if (e.key.toLowerCase() === 'q') {
            dropItem();
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
    
    document.querySelectorAll('.hotbar-slot').forEach((el, idx) => {
        if (idx === slot) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

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
            
            if (data.worldState && data.worldState.drops) {
                data.worldState.drops.forEach(d => {
                    drops.set(d.id, d);
                });
            }
            
            // Load resource nodes
            if (data.worldState && data.worldState.resourceNodes) {
                data.worldState.resourceNodes.forEach(r => {
                    resourceNodes.set(r.id, r);
                });
            }
            
            // Load saved data from database
            let startX = WORLD_SIZE / 2;
            let startY = WORLD_SIZE / 2;
            
            if (data.savedX !== null && data.savedY !== null) {
                startX = data.savedX;
                startY = data.savedY;
                hasLoadedFromDB = true;
            }
            
            if (data.savedInventory) {
                inventory = data.savedInventory;
                hasLoadedFromDB = true;
                console.log('Loaded saved inventory:', inventory);
            } else {
                // Only give starting materials if no saved data exists
                inventory = { wood: 20, stone: 10 };
            }
            
            if (data.savedHealth !== null) {
                health = data.savedHealth;
                hasLoadedFromDB = true;
                console.log('Loaded saved health:', health);
            }
            
            updateInventoryUI();
            document.getElementById('healthValue').textContent = health;
            
            myPlayerData = {
                id: myPlayerId,
                username: userProfile.username,
                x: startX,
                y: startY,
                health: health,
                inventory: inventory,
                icon: userProfile.gladiatorCosmetics?.icon || '⚔️',
                color: userProfile.gladiatorCosmetics?.slashColor || '#ffffff'
            };
            document.getElementById('posX').textContent = Math.floor(startX);
            document.getElementById('posY').textContent = Math.floor(startY);
            updatePlayerList();
            startGameLoop();
        });
        
        relay.on('player_joined', (data) => {
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
                health: health,
                inventory: inventory
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
        case 'death_drop':
            handleRemoteDeathDrop(actionData);
            break;
        case 'pickup_drop':
            handleRemotePickup(actionData);
            break;
        case 'damage_resource':
            handleResourceDamage(actionData);
            break;
        case 'spawn_resources':
            handleResourceSpawn(actionData);
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
            color: data.color || '#ffffff',
            inventory: data.inventory || { wood: 0, stone: 0 }
        });
    } else {
        const player = players.get(playerId);
        player.x = data.x;
        player.y = data.y;
        player.health = data.health;
        player.inventory = data.inventory || player.inventory;
        if (data.username) player.username = data.username;
        if (data.icon) player.icon = data.icon;
        if (data.color) player.color = data.color;
    }
}

function startGameLoop() {
    requestAnimationFrame(gameLoop);
    startCharging();
}

let lastFrameTime = Date.now();

function gameLoop() {
    if (!myPlayerData) return;
    
    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / (1000 / 60);
    lastFrameTime = now;
    
    let dx = 0, dy = 0;
    const speed = PLAYER_SPEED * deltaTime;
    if (keys['w']) dy -= speed;
    if (keys['s']) dy += speed;
    if (keys['a']) dx -= speed;
    if (keys['d']) dx += speed;
    
    if (dx !== 0 || dy !== 0) {
        const newX = Math.max(0, Math.min(WORLD_SIZE, myPlayerData.x + dx));
        const newY = Math.max(0, Math.min(WORLD_SIZE, myPlayerData.y + dy));
        
        let canMove = true;
        const playerRadius = 15;
        
        for (const building of buildings.values()) {
            if (building.type.includes('floor')) continue;
            
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
            document.getElementById('posX').textContent = Math.floor(newX);
            document.getElementById('posY').textContent = Math.floor(newY);
        }
    }
    
    cameraX = myPlayerData.x - canvas.width / 2;
    cameraY = myPlayerData.y - canvas.height / 2;
    
    render();
    requestAnimationFrame(gameLoop);
}

function startCharging() {
    chargeInterval = setInterval(() => {
        if (selectedSlot === 0 && meterCharge < 100) {
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
    
    if (selectedSlot >= 1 && selectedSlot <= 3) {
        placeBuild(mouseWorldX, mouseWorldY);
        return;
    }
    
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
        
        // Check for resource nodes first
        for (const resource of resourceNodes.values()) {
            if (checkCollision(mouseWorldX, mouseWorldY, 10, resource.x, resource.y, 40)) {
                damageResource(resource.id, damage);
                meterCharge = 0;
                document.getElementById('meterFill').style.width = '0%';
                return;
            }
        }
        
        // Then check buildings
        for (const building of buildings.values()) {
            if (checkCollision(mouseWorldX, mouseWorldY, 10, building.x, building.y, TILE_SIZE)) {
                damageBuilding(building.id, damage);
                meterCharge = 0;
                document.getElementById('meterFill').style.width = '0%';
                return;
            }
        }
        
        // Then check players
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
        
        const gridX = Math.floor(mouseWorldX / TILE_SIZE) * TILE_SIZE;
        const gridY = Math.floor(mouseWorldY / TILE_SIZE) * TILE_SIZE;
        
        buildPreview = {
            x: gridX,
            y: gridY,
            valid: canPlaceBuild(gridX, gridY)
        };
    } else {
        buildPreview = null;
    }
}

function canPlaceBuild(x, y) {
    // Check range
    const distance = Math.sqrt(
        Math.pow(x + TILE_SIZE/2 - myPlayerData.x, 2) + 
        Math.pow(y + TILE_SIZE/2 - myPlayerData.y, 2)
    );
    if (distance > BUILD_RANGE) {
        return false;
    }
    
    // Check if in spawn
    if (isInSpawn(x, y)) {
        return false;
    }
    
    // Check resources
    const buildTypes = ['axe', 'wood_wall', 'stone_wall', 'wood_floor'];
    const buildType = buildTypes[selectedSlot];
    
    const costs = {
        wood_wall: { wood: 5 },
        stone_wall: { stone: 8 },
        wood_floor: { wood: 3 }
    };
    
    const cost = costs[buildType];
    if (cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if ((inventory[resource] || 0) < amount) {
                return false;
            }
        }
    }
    
    // Check collision with existing buildings
    for (const building of buildings.values()) {
        if (Math.abs(building.x - x) < TILE_SIZE && Math.abs(building.y - y) < TILE_SIZE) {
            return false;
        }
    }
    
    // Check collision with players
    for (const player of players.values()) {
        const playerInBuild = player.x >= x && player.x <= x + TILE_SIZE &&
                             player.y >= y && player.y <= y + TILE_SIZE;
        if (playerInBuild) {
            return false;
        }
    }
    
    // Check collision with yourself
    const myInBuild = myPlayerData.x >= x && myPlayerData.x <= x + TILE_SIZE &&
                      myPlayerData.y >= y && myPlayerData.y <= y + TILE_SIZE;
    if (myInBuild) {
        return false;
    }
    
    return true;
}

function placeBuild(worldX, worldY) {
    if (!buildPreview || !buildPreview.valid) return;
    
    const x = buildPreview.x;
    const y = buildPreview.y;
    
    const buildTypes = ['axe', 'wood_wall', 'stone_wall', 'wood_floor'];
    const buildType = buildTypes[selectedSlot];
    
    const costs = {
        wood_wall: { wood: 5 },
        stone_wall: { stone: 8 },
        wood_floor: { wood: 3 }
    };
    
    const cost = costs[buildType];
    if (!cost) return;
    
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
    
    if (relay && relay.connected) {
        relay.sendPlayerAction('damage_building', {
            buildingId: buildingId,
            damage: damage,
            destroyed: destroyed
        });
    }
}

function damageResource(resourceId, damage) {
    const resource = resourceNodes.get(resourceId);
    if (!resource) return;
    
    resource.health -= damage;
    
    let destroyed = false;
    let reward = null;
    
    if (resource.health <= 0) {
        destroyed = true;
        
        // Give rewards
        if (resource.type === 'tree') {
            inventory.wood += 10;
            reward = { wood: 10 };
        } else if (resource.type === 'stone') {
            inventory.stone += 5;
            reward = { stone: 5 };
        }
        
        updateInventoryUI();
        
        // Visual feedback
        canvas.style.filter = 'brightness(1.3)';
        setTimeout(() => {
            canvas.style.filter = 'brightness(1)';
        }, 100);
        
        resourceNodes.delete(resourceId);
    }
    
    if (relay && relay.connected) {
        relay.sendPlayerAction('damage_resource', {
            resourceId: resourceId,
            damage: damage,
            destroyed: destroyed,
            reward: reward
        });
    }
}

function handleResourceDamage(data) {
    const resource = resourceNodes.get(data.resourceId);
    if (!resource) return;
    
    // Use server's authoritative health value
    if (data.currentHealth !== undefined) {
        resource.health = data.currentHealth;
    }
    
    if (data.destroyed) {
        resourceNodes.delete(data.resourceId);
    }
}
function handleResourceSpawn(data) {
    data.nodes.forEach(node => {
        resourceNodes.set(node.id, node);
    });
}

function attackPlayer(targetId, damage) {
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
    
    // Use server's authoritative health value
    if (data.currentHealth !== undefined) {
        building.health = data.currentHealth;
    }
    
    if (data.destroyed) {
        buildings.delete(data.buildingId);
    }
}

function handlePlayerAttack(attackerId, data) {
    if (data.targetId === myPlayerId) {
        health = Math.max(0, health - data.damage);
        myPlayerData.health = health;
        document.getElementById('healthValue').textContent = health;
        
        canvas.style.filter = 'brightness(0.5)';
        setTimeout(() => {
            canvas.style.filter = 'brightness(1)';
        }, 100);
        
        if (health <= 0) {
            handleDeath();
        }
    } else {
        const player = players.get(data.targetId);
        if (player) {
            player.health = Math.max(0, player.health - data.damage);
        }
    }
}

function handleDeath() {
    const deathX = myPlayerData.x;
    const deathY = myPlayerData.y;
    
    // Drop all items at death location
    if (relay && relay.connected) {
        relay.sendPlayerAction('death_drop', {
            x: deathX,
            y: deathY,
            inventory: inventory
        });
    }
    
    // Clear inventory immediately
    inventory = { wood: 0, stone: 0 };
    updateInventoryUI();
    
    // Teleport to spawn IMMEDIATELY (before showing death screen)
    myPlayerData.x = WORLD_SIZE / 2;
    myPlayerData.y = WORLD_SIZE / 2;
    myPlayerData.health = 100;
    health = 100;
    
    // Update camera to spawn
    cameraX = myPlayerData.x - canvas.width / 2;
    cameraY = myPlayerData.y - canvas.height / 2;
    
    // Send respawn position to server immediately
    if (relay && relay.connected) {
        relay.sendPlayerAction('player_update', {
            x: myPlayerData.x,
            y: myPlayerData.y,
            health: health,
            inventory: inventory
        });
    }
    
    // Update health UI
    document.getElementById('healthValue').textContent = 100;
    
    // Show death screen but keep rendering
    showDeathScreen();
}

function handleRemoteDeathDrop(dropData) {
    drops.set(dropData.id, dropData);
}

function handleRemotePickup(data) {
    drops.delete(data.dropId);
}

function tryPickupNearbyDrop() {
    for (const drop of drops.values()) {
        const distance = Math.sqrt(
            Math.pow(drop.x - myPlayerData.x, 2) + 
            Math.pow(drop.y - myPlayerData.y, 2)
        );
        
        if (distance < PICKUP_RANGE) {
            // Add items to inventory
            for (const [resource, amount] of Object.entries(drop.inventory)) {
                inventory[resource] = (inventory[resource] || 0) + amount;
            }
            
            updateInventoryUI();
            
            // Tell server to remove drop
            if (relay && relay.connected) {
                relay.sendPlayerAction('pickup_drop', {
                    dropId: drop.id
                });
            }
            
            // Remove locally
            drops.delete(drop.id);
            
            // Visual feedback
            canvas.style.filter = 'brightness(1.3)';
            setTimeout(() => {
                canvas.style.filter = 'brightness(1)';
            }, 100);
            
            break; // Only pickup one drop per press
        }
    }
}

function dropItem() {
    // Can't drop axe (slot 0)
    if (selectedSlot === 0) {
        return;
    }
    
    // Determine which resource to drop based on selected slot
    let resourceToDrop = null;
    
    if (selectedSlot === 1) {
        // Wood wall slot = drop wood
        resourceToDrop = 'wood';
    } else if (selectedSlot === 2) {
        // Stone wall slot = drop stone
        resourceToDrop = 'stone';
    } else if (selectedSlot === 3) {
        // Wood floor slot = drop wood
        resourceToDrop = 'wood';
    }
    
    // Check if you have any of that resource
    if (!resourceToDrop || (inventory[resourceToDrop] || 0) <= 0) {
        return; // Nothing to drop
    }
    
    // Remove 1 from inventory
    inventory[resourceToDrop] -= 1;
    updateInventoryUI();
    
    // Create drop at player position with ONLY the item being dropped
    const dropInventory = { wood: 0, stone: 0 };
    dropInventory[resourceToDrop] = 1;
    
    if (relay && relay.connected) {
        relay.sendPlayerAction('death_drop', {
            x: myPlayerData.x,
            y: myPlayerData.y,
            inventory: dropInventory
        });
    }
}

function showDeathScreen() {
    const deathScreen = document.createElement('div');
    deathScreen.id = 'deathScreen';
    deathScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    deathScreen.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 72px; margin-bottom: 20px;">💀</div>
            <div style="font-size: 48px; color: #ff4444; font-weight: bold; margin-bottom: 30px;">YOU DIED</div>
            <div style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Your items have been dropped</div>
            <button id="respawnBtn" style="
                padding: 15px 40px;
                background: #4ade80;
                border: none;
                border-radius: 8px;
                color: #000;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.background='#22c55e'" onmouseout="this.style.background='#4ade80'">
                RESPAWN
            </button>
        </div>
    `;
    
    document.body.appendChild(deathScreen);
    
    document.getElementById('respawnBtn').addEventListener('click', () => {
        deathScreen.remove();
        respawn();
    });
}

function respawn() {
    // Player is already at spawn (moved there on death)
    // Just force a render to ensure everything is visible
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw resource nodes
    for (const resource of resourceNodes.values()) {
        const screenX = resource.x - cameraX;
        const screenY = resource.y - cameraY;
        
        if (resource.type === 'tree') {
            // Draw tree
            // Trunk
            ctx.fillStyle = '#78350f';
            ctx.fillRect(screenX + 15, screenY + 20, 10, 20);
            
            // Leaves (3 circles for a fuller look)
            const leafGradient = ctx.createRadialGradient(screenX + 20, screenY + 15, 5, screenX + 20, screenY + 15, 18);
            leafGradient.addColorStop(0, '#22c55e');
            leafGradient.addColorStop(1, '#166534');
            
            ctx.fillStyle = leafGradient;
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 10, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(screenX + 10, screenY + 18, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(screenX + 30, screenY + 18, 12, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (resource.type === 'stone') {
            // Draw stone rock with gradient
            const rockGradient = ctx.createRadialGradient(screenX + 20, screenY + 20, 5, screenX + 20, screenY + 20, 18);
            rockGradient.addColorStop(0, '#9ca3af');
            rockGradient.addColorStop(1, '#4b5563');
            
            ctx.fillStyle = rockGradient;
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 20, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some darker spots for texture
            ctx.fillStyle = '#374151';
            ctx.beginPath();
            ctx.arc(screenX + 15, screenY + 18, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(screenX + 26, screenY + 23, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(229, 231, 235, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX + 17, screenY + 15, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Health bar for resources (only show if damaged)
        if (resource.health < resource.maxHealth) {
            const healthPercent = resource.health / resource.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 8, 40, 5);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(screenX, screenY - 8, 40 * healthPercent, 5);
        }
    }
    
    // Draw death drops
    for (const drop of drops.values()) {
        const screenX = drop.x - cameraX;
        const screenY = drop.y - cameraY;
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalAlpha = pulse;
        
        // Draw glowing chest
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw chest icon
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText('📦', screenX, screenY);
        
        ctx.restore();
        
        // Show "E to pickup" if player is nearby
        const distance = Math.sqrt(
            Math.pow(drop.x - myPlayerData.x, 2) + 
            Math.pow(drop.y - myPlayerData.y, 2)
        );
        
        if (distance < PICKUP_RANGE) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText('[E] Pickup', screenX, screenY - 35);
            ctx.fillText('[E] Pickup', screenX, screenY - 35);
        }
    }
    
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
        
        // Only show health bar if damaged
        if (building.health < building.maxHealth) {
            const healthPercent = building.health / building.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 8, TILE_SIZE, 5);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(screenX, screenY - 8, TILE_SIZE * healthPercent, 5);
        }
    }
    
    for (const player of players.values()) {
        const screenX = player.x - cameraX;
        const screenY = player.y - cameraY;
        
        // Handle rainbow color
        let displayColor = player.color || '#ef4444';
        if (displayColor === 'rainbow') {
            const gradient = ctx.createLinearGradient(screenX - 15, screenY - 15, screenX + 15, screenY + 15);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.17, '#ff7f00');
            gradient.addColorStop(0.33, '#ffff00');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(0.67, '#0000ff');
            gradient.addColorStop(0.83, '#4b0082');
            gradient.addColorStop(1, '#9400d3');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = displayColor;
        }
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.icon, screenX, screenY);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(player.username, screenX, screenY - 30);
        ctx.fillText(player.username, screenX, screenY - 30);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 25, screenY - 40, 50, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(screenX - 25, screenY - 40, 50 * (player.health / 100), 5);
    }
    
    const myScreenX = myPlayerData.x - cameraX;
    const myScreenY = myPlayerData.y - cameraY;
    
    const myColor = userProfile.gladiatorCosmetics?.slashColor || '#3b82f6';
    
    // Handle rainbow for your player
    if (myColor === 'rainbow') {
        const gradient = ctx.createLinearGradient(myScreenX - 15, myScreenY - 15, myScreenX + 15, myScreenY + 15);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.17, '#ff7f00');
        gradient.addColorStop(0.33, '#ffff00');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(0.67, '#0000ff');
        gradient.addColorStop(0.83, '#4b0082');
        gradient.addColorStop(1, '#9400d3');
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = myColor;
    }
    
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
    
    if (buildPreview && selectedSlot >= 1) {
        const previewX = buildPreview.x - cameraX;
        const previewY = buildPreview.y - cameraY;
        
        const isValid = buildPreview.valid;
        
        ctx.fillStyle = isValid ? 'rgba(100, 200, 100, 0.3)' : 'rgba(200, 100, 100, 0.3)';
        ctx.fillRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = isValid ? '#4ade80' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
    }
    
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
    
    const myEntry = document.createElement('div');
    myEntry.className = 'player-entry';
    myEntry.textContent = userProfile.username + ' (You)';
    myEntry.style.color = '#4ade80';
    list.appendChild(myEntry);
    
    for (const player of players.values()) {
        const entry = document.createElement('div');
        entry.className = 'player-entry';
        entry.textContent = player.username;
        list.appendChild(entry);
    }
    
    document.getElementById('playerCount').textContent = players.size + 1;
}

init();
