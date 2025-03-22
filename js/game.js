import * as THREE from 'three';

// Game State Management
const gameState = {
    // Server-controlled state
    serverState: {
        score: 0,
        isGameOver: false,
        speed: 0.3,
        spawnInterval: 45,
        gameStarted: false,
        worldWidth: 60
    },
    // Client-only state
    clientState: {
        playerSpeed: 0.4,
        lastObstacleSpawn: 0,
        lastServerSync: 0,
        syncInterval: 200 // Sync with server every one fifth second
    }
};

// Global variables that need to be accessible across functions
let scene, camera, renderer, player, playerBoundingBox, obstacles = [];

// Game State Validation Functions
function validateGameState() {
    // This would normally communicate with server
    // For now, we'll just validate local state
    return {
        isValid: true,
        serverState: gameState.serverState
    };
}

function syncWithServer() {
    const now = Date.now();
    if (now - gameState.clientState.lastServerSync >= gameState.clientState.syncInterval) {
        const validation = validateGameState();
        if (validation.isValid) {
            gameState.serverState = validation.serverState;
        }
        gameState.clientState.lastServerSync = now;
    }
}

// Scene Initialization
function initializeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000066);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 6;
    camera.position.z = 12;
    camera.rotation.x = -0.5;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameContainer').appendChild(renderer.domElement);
}

// Lighting Setup
function initializeLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 10, -10);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight1.position.set(0, 5, -5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff0000, 1, 100);
    pointLight2.position.set(0, 5, 20);
    scene.add(pointLight2);
}

// Player Setup
function initializePlayer() {
    const playerGeometry = new THREE.ConeGeometry(0.4, 1, 3);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x0033ff,
        emissiveIntensity: 0.8,
        shininess: 100
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, -0.5, 5);
    player.rotation.x = -Math.PI / 2;
    scene.add(player);

    playerBoundingBox = new THREE.Box3().setFromObject(player);
}

// Environment Setup
function initializeEnvironment() {
    const groundGeometry = new THREE.PlaneGeometry(gameState.serverState.worldWidth, 1000);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0044ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 400;
    ground.position.y = -1;
    scene.add(ground);

    const wallGeometry = new THREE.PlaneGeometry(1000, 10);
    const wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x0044ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.x = -15;
    leftWall.position.y = 4;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.x = 15;
    rightWall.position.y = 4;
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
}

// UI Setup
function initializeUI() {
    const startPrompt = document.createElement('div');
    startPrompt.id = 'startPrompt';
    startPrompt.style.position = 'fixed';
    startPrompt.style.top = '50%';
    startPrompt.style.left = '50%';
    startPrompt.style.transform = 'translate(-50%, -50%)';
    startPrompt.style.color = 'white';
    startPrompt.style.fontSize = '24px';
    startPrompt.style.textAlign = 'center';
    startPrompt.innerHTML = 'Press any arrow key to start!';
    document.body.appendChild(startPrompt);
}

// Event Handlers Setup
function initializeEventHandlers() {
    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    window.addEventListener('keydown', (e) => {
        if (!gameState.serverState.gameStarted) {
            gameState.serverState.gameStarted = true;
            document.getElementById('startPrompt').style.display = 'none';
        }
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'ArrowRight':
                keys.right = true;
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
        }
    });
}

// Input Handling
const keys = {
    left: false,
    right: false
};

// Obstacle Management
function createObstacle(x, z) {
    // This would normally receive obstacle data from server
    const positions = [
        x,
        x + gameState.serverState.worldWidth,
        x - gameState.serverState.worldWidth
    ];

    positions.forEach(xPos => {
        const size = 1.2 + Math.random() * 0.4;
        const obstacleGeometry = new THREE.BoxGeometry(size, size, size);
        const obstacleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9,
            shininess: 100
        });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(xPos, 0, z);
        scene.add(obstacle);
        obstacles.push(obstacle);
    });
}

function createObstaclePattern() {
    // This would normally receive pattern data from server
    const z = -80;
    const pattern = Math.floor(Math.random() * 5);
    const halfWidth = gameState.serverState.worldWidth / 2;

    switch(pattern) {
        case 0: // Infinite wave pattern
            for (let i = 0; i < 8; i++) {
                const baseX = (i * 5) - halfWidth;
                const waveX = baseX + Math.sin(i * 0.5) * 8;
                createObstacle(wrapCoordinate(waveX), z - i * 8);
            }
            break;
        case 1: // Scattered blocks
            for (let i = 0; i < 12; i++) {
                const x = (Math.random() * gameState.serverState.worldWidth) - halfWidth;
                createObstacle(x, z - i * 6);
            }
            break;
        case 2: // Diagonal walls
            for (let i = 0; i < 10; i++) {
                const x = ((i * 6) % gameState.serverState.worldWidth) - halfWidth;
                createObstacle(x, z - i * 6);
            }
            break;
        case 3: // Zigzag walls
            for (let i = 0; i < 8; i++) {
                const x = ((i * 8) % gameState.serverState.worldWidth) - halfWidth;
                createObstacle(x, z - i * 8);
                createObstacle(x + 10, z - i * 8);
            }
            break;
        case 4: // Spiral pattern
            for (let i = 0; i < 12; i++) {
                const angle = i * 0.5;
                const radius = 15 - (i * 0.5);
                const x = Math.cos(angle) * radius;
                createObstacle(wrapCoordinate(x), z - i * 5);
            }
            break;
    }
}

function updateObstacles() {
    if (!gameState.serverState.gameStarted) return;

    gameState.clientState.lastObstacleSpawn++;
    if (gameState.clientState.lastObstacleSpawn >= gameState.serverState.spawnInterval) {
        createObstaclePattern();
        gameState.clientState.lastObstacleSpawn = 0;
        // Server would normally control these values
        gameState.serverState.spawnInterval = Math.max(35, gameState.serverState.spawnInterval - 0.3);
        gameState.serverState.speed = Math.min(0.45, gameState.serverState.speed + 0.0003);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += gameState.serverState.speed;
        obstacle.rotation.x += 0.01;
        obstacle.rotation.y += 0.01;

        if (obstacle.position.z > 15) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }
}

// Collision Detection
function checkCollisions() {
    // This would normally send position data to server for validation
    for (const obstacle of obstacles) {
        const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBoundingBox.intersectsBox(obstacleBoundingBox)) {
            gameState.serverState.isGameOver = true;
            showGameOver();
            return true;
        }
    }
    return false;
}

// Score Management
function updateScore() {
    if (!gameState.serverState.isGameOver && gameState.serverState.gameStarted) {
        // Server would normally calculate and validate score
        gameState.serverState.score += 0.1;
        document.getElementById('scoreValue').textContent = Math.floor(gameState.serverState.score);
    }
}

// Game Over Management
function showGameOver() {
    // This would normally receive final score and winnings from server
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'fixed';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.innerHTML = `
        <h2>Game Over!</h2>
        <p>Score: ${Math.floor(gameState.serverState.score)}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
            Play Again
        </button>
    `;
    document.body.appendChild(gameOverDiv);
}

// Utility Functions
function wrapCoordinate(x) {
    const halfWidth = gameState.serverState.worldWidth / 2;
    return ((x + halfWidth) % gameState.serverState.worldWidth) - halfWidth;
}

function updatePlayer() {
    if (keys.left) {
        player.position.x -= gameState.clientState.playerSpeed;
        player.rotation.z = Math.min(player.rotation.z + 0.1, 0.3);
        if (player.position.x < -gameState.serverState.worldWidth/2) {
            player.position.x += gameState.serverState.worldWidth;
        }
    } else if (keys.right) {
        player.position.x += gameState.clientState.playerSpeed;
        player.rotation.z = Math.max(player.rotation.z - 0.1, -0.3);
        if (player.position.x > gameState.serverState.worldWidth/2) {
            player.position.x -= gameState.serverState.worldWidth;
        }
    } else {
        player.rotation.z *= 0.9;
    }
    playerBoundingBox.setFromObject(player);
    camera.position.x = player.position.x;
}

// Game Initialization
function initializeGame() {
    initializeScene();
    initializeLighting();
    initializePlayer();
    initializeEnvironment();
    initializeUI();
    initializeEventHandlers();
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (!gameState.serverState.isGameOver) {
        syncWithServer();
        updatePlayer();
        updateObstacles();
        updateScore();
        
        if (checkCollisions()) return;
    }

    renderer.render(scene, camera);
}

// Start the game
initializeGame();
animate(); 