import * as THREE from 'three';
import { GameServer } from './GameServer.js';

export class GameClient {
    constructor() {
        this.server = new GameServer();
        this.state = {
            lastObstacleSpawn: 0
        };
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.playerBoundingBox = null;
        this.obstacles = [];
        this.keys = {
            left: false,
            right: false
        };
    }

    initializeScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 6;
        this.camera.position.z = 12;
        this.camera.rotation.x = -0.5;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        this.createStarfield();
    }

    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const radius = 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const color = new THREE.Color();
            const hue = Math.random() < 0.7 ? 0.5 + Math.random() * 0.1 : 0.6;
            color.setHSL(hue, 0.8, 0.7 + Math.random() * 0.3);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(starField);
    }

    initializeLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(0, 10, -10);
        this.scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
        pointLight1.position.set(0, 5, -5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff0000, 1, 100);
        pointLight2.position.set(0, 5, 20);
        this.scene.add(pointLight2);
    }

    initializePlayer() {
        const playerGeometry = new THREE.ConeGeometry(0.4, 1, 3);
        const playerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            emissive: 0x0033ff,
            emissiveIntensity: 0.8,
            shininess: 100
        });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        
        // Use server's initial player state
        const initialState = this.server.getInitialPlayerState();
        this.player.position.set(
            initialState.position.x,
            initialState.position.y,
            initialState.position.z
        );
        this.player.rotation.set(
            initialState.rotation.x,
            initialState.rotation.y,
            initialState.rotation.z
        );
        
        this.scene.add(this.player);
        this.playerBoundingBox = new THREE.Box3().setFromObject(this.player);
    }

    initializeEnvironment() {
        const groundGeometry = new THREE.PlaneGeometry(this.server.state.worldWidth * 10, 2000);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.4,
            shininess: 0,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < 3; i++) {
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.z = 800 + (i * 2000);
            ground.position.y = -1;
            this.scene.add(ground);
        }
    }

    initializeUI() {
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

    initializeEventHandlers() {
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(newWidth, newHeight);
        });

        window.addEventListener('keydown', (e) => {
            if (!this.server.state.gameStarted) {
                this.server.state.gameStarted = true;
                document.getElementById('startPrompt').style.display = 'none';
            }
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }

    createObstacle(obstacleData) {
        obstacleData.forEach(data => {
            const obstacleGeometry = new THREE.BoxGeometry(data.size, data.size, data.size);
            const obstacleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9,
                shininess: 100
            });
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(data.x, 0, data.z);
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
        });
    }

    updateObstacles() {
        if (!this.server.state.gameStarted) return;

        this.state.lastObstacleSpawn++;
        if (this.state.lastObstacleSpawn >= this.server.state.spawnInterval) {
            const newObstacles = this.server.createObstaclePattern();
            this.createObstacle(newObstacles);
            this.state.lastObstacleSpawn = 0;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += this.server.state.speed;
            obstacle.rotation.x += 0.01;
            obstacle.rotation.y += 0.01;

            if (obstacle.position.z > 15) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
    }

    updatePlayer() {
        // Update visual representation from server state
        const playerState = this.server.state.player;
        this.player.position.set(
            playerState.position.x,
            playerState.position.y,
            playerState.position.z
        );
        this.player.rotation.set(
            playerState.rotation.x,
            playerState.rotation.y,
            playerState.rotation.z
        );
        
        this.playerBoundingBox.setFromObject(this.player);
        this.camera.position.x = this.player.position.x;
    }

    updateScore() {
        if (!this.server.state.isGameOver && this.server.state.gameStarted) {
            const score = this.server.updateScore();
            document.getElementById('scoreValue').textContent = Math.floor(score);
        }
    }

    showGameOver() {
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
            <p>Score: ${Math.floor(this.server.state.score)}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
                Play Again
            </button>
        `;
        document.body.appendChild(gameOverDiv);
    }

    initializeGame() {
        this.initializeScene();
        this.initializeLighting();
        this.initializePlayer();
        this.initializeEnvironment();
        this.initializeUI();
        this.initializeEventHandlers();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!this.server.state.isGameOver) {
            // Update server state with current input
            this.server.updatePlayer(this.keys);
            
            // Update visual representation from server state
            const playerState = this.server.state.player;
            this.player.position.set(
                playerState.position.x,
                playerState.position.y,
                playerState.position.z
            );
            this.player.rotation.set(
                playerState.rotation.x,
                playerState.rotation.y,
                playerState.rotation.z
            );
            
            this.playerBoundingBox.setFromObject(this.player);
            this.camera.position.x = this.player.position.x;

            this.updateObstacles();
            this.updateScore();
            
            if (this.server.checkCollisions(null, this.obstacles)) {
                this.showGameOver();
                return;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
} 