import * as THREE from 'three';

// Game state
let gameState = {
    score: 0,
    isGameOver: false,
    speed: 0.3,
    playerSpeed: 0.4,
    lastObstacleSpawn: 0,
    spawnInterval: 45, // Frames between obstacle group spawns
    gameStarted: false,
    worldWidth: 60 // Width of the repeating world segment
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000066); // Brighter blue background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('gameContainer').appendChild(renderer.domElement);

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Brighter ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Brighter directional light
directionalLight.position.set(0, 10, -10);
scene.add(directionalLight);

// Add point lights for better visibility
const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
pointLight1.position.set(0, 5, -5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff0000, 1, 100);
pointLight2.position.set(0, 5, 20);
scene.add(pointLight2);

// Player triangle with enhanced visibility
const playerGeometry = new THREE.ConeGeometry(0.4, 1, 3); // Made triangle smaller
const playerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ffff,
    emissive: 0x0033ff,
    emissiveIntensity: 0.8,
    shininess: 100
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, -0.5, 5); // Moved player lower
player.rotation.x = -Math.PI / 2; // Flipped triangle to point forward
scene.add(player);

// Create player bounding box
const playerBoundingBox = new THREE.Box3().setFromObject(player);

// Add ground plane with grid for better perspective
const groundGeometry = new THREE.PlaneGeometry(gameState.worldWidth, 1000);
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

// Add side walls for better perspective
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

// Obstacles array
const obstacles = [];

// Function to wrap a coordinate around the world width
function wrapCoordinate(x) {
    const halfWidth = gameState.worldWidth / 2;
    return ((x + halfWidth) % gameState.worldWidth) - halfWidth;
}

// Create a single obstacle with enhanced visibility
function createObstacle(x, z) {
    // Create three instances of the obstacle for seamless wrapping
    const positions = [
        x,
        x + gameState.worldWidth,
        x - gameState.worldWidth
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

// Create a group of obstacles in different patterns
function createObstaclePattern() {
    const z = -80;
    const pattern = Math.floor(Math.random() * 5);
    const halfWidth = gameState.worldWidth / 2;

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
                const x = (Math.random() * gameState.worldWidth) - halfWidth;
                createObstacle(x, z - i * 6);
            }
            break;
        case 2: // Diagonal walls
            for (let i = 0; i < 10; i++) {
                const x = ((i * 6) % gameState.worldWidth) - halfWidth;
                createObstacle(x, z - i * 6);
            }
            break;
        case 3: // Zigzag walls
            for (let i = 0; i < 8; i++) {
                const x = ((i * 8) % gameState.worldWidth) - halfWidth;
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

// Position camera for better view
camera.position.y = 6;
camera.position.z = 12;
camera.rotation.x = -0.5; // Adjusted camera angle for better view of lower player

// Input handling
const keys = {
    left: false,
    right: false
};

window.addEventListener('keydown', (e) => {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
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

// Update player position based on input
function updatePlayer() {
    if (keys.left) {
        player.position.x -= gameState.playerSpeed;
        player.rotation.z = Math.min(player.rotation.z + 0.1, 0.3);
        // Wrap around from left to right
        if (player.position.x < -gameState.worldWidth/2) {
            player.position.x += gameState.worldWidth;
        }
    } else if (keys.right) {
        player.position.x += gameState.playerSpeed;
        player.rotation.z = Math.max(player.rotation.z - 0.1, -0.3);
        // Wrap around from right to left
        if (player.position.x > gameState.worldWidth/2) {
            player.position.x -= gameState.worldWidth;
        }
    } else {
        player.rotation.z *= 0.9;
    }
    playerBoundingBox.setFromObject(player);

    // Update camera to follow player horizontally
    camera.position.x = player.position.x;
}

// Update obstacles
function updateObstacles() {
    if (!gameState.gameStarted) return;

    // Spawn new obstacles
    gameState.lastObstacleSpawn++;
    if (gameState.lastObstacleSpawn >= gameState.spawnInterval) {
        createObstaclePattern();
        gameState.lastObstacleSpawn = 0;
        // More gradual difficulty increase
        gameState.spawnInterval = Math.max(35, gameState.spawnInterval - 0.3);
        gameState.speed = Math.min(0.45, gameState.speed + 0.0003);
    }

    // Update existing obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += gameState.speed;
        obstacle.rotation.x += 0.01;
        obstacle.rotation.y += 0.01;

        if (obstacle.position.z > 15) { // Increased removal distance
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }
}

// Check collisions
function checkCollisions() {
    for (const obstacle of obstacles) {
        const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBoundingBox.intersectsBox(obstacleBoundingBox)) {
            gameState.isGameOver = true;
            showGameOver();
            return true;
        }
    }
    return false;
}

// Show game over screen
function showGameOver() {
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
        <p>Score: ${Math.floor(gameState.score)}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
            Play Again
        </button>
    `;
    document.body.appendChild(gameOverDiv);
}

// Update score
function updateScore() {
    if (!gameState.isGameOver && gameState.gameStarted) {
        gameState.score += 0.1;
        document.getElementById('scoreValue').textContent = Math.floor(gameState.score);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!gameState.isGameOver) {
        updatePlayer();
        updateObstacles();
        updateScore();
        
        if (checkCollisions()) return;
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

// Add start prompt
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

// Start the game
animate(); 