import * as THREE from 'three';

export class GameServer {
    constructor() {
        this.state = {
            score: 0,
            isGameOver: false,
            speed: 0.3,
            spawnInterval: 45,
            gameStarted: false,
            worldWidth: 60
        };
    }

    validateGameState() {
        // Validate and return authoritative state
        return {
            isValid: true,
            serverState: this.state
        };
    }

    syncWithClient(clientData) {
        // Process client updates and send authoritative state
        const now = Date.now();
        if (now - clientData.lastServerSync >= clientData.syncInterval) {
            const validation = this.validateGameState();
            if (validation.isValid) {
                return validation.serverState;
            }
        }
        return this.state;
    }

    createObstacle(x, z) {
        // Generate and return obstacle data
        const positions = [
            x,
            x + this.state.worldWidth,
            x - this.state.worldWidth
        ];

        return positions.map(xPos => ({
            x: xPos,
            z: z,
            size: 1.2 + Math.random() * 0.4
        }));
    }

    createObstaclePattern() {
        // Generate pattern data
        const z = -80;
        const pattern = Math.floor(Math.random() * 5);
        const halfWidth = this.state.worldWidth / 2;
        const obstacles = [];

        switch(pattern) {
            case 0: // Infinite wave pattern
                for (let i = 0; i < 8; i++) {
                    const baseX = (i * 5) - halfWidth;
                    const waveX = baseX + Math.sin(i * 0.5) * 8;
                    obstacles.push(...this.createObstacle(this.wrapCoordinate(waveX), z - i * 8));
                }
                break;
            case 1: // Scattered blocks
                for (let i = 0; i < 12; i++) {
                    const x = (Math.random() * this.state.worldWidth) - halfWidth;
                    obstacles.push(...this.createObstacle(x, z - i * 6));
                }
                break;
            case 2: // Diagonal walls
                for (let i = 0; i < 10; i++) {
                    const x = ((i * 6) % this.state.worldWidth) - halfWidth;
                    obstacles.push(...this.createObstacle(x, z - i * 6));
                }
                break;
            case 3: // Zigzag walls
                for (let i = 0; i < 8; i++) {
                    const x = ((i * 8) % this.state.worldWidth) - halfWidth;
                    obstacles.push(...this.createObstacle(x, z - i * 8));
                    obstacles.push(...this.createObstacle(x + 10, z - i * 8));
                }
                break;
            case 4: // Spiral pattern
                for (let i = 0; i < 12; i++) {
                    const angle = i * 0.5;
                    const radius = 15 - (i * 0.5);
                    const x = Math.cos(angle) * radius;
                    obstacles.push(...this.createObstacle(this.wrapCoordinate(x), z - i * 5));
                }
                break;
        }

        return obstacles;
    }

    updateObstacles() {
        if (!this.state.gameStarted) return;

        // Update obstacle positions and spawn new ones
        this.state.spawnInterval = Math.max(35, this.state.spawnInterval - 0.3);
        this.state.speed = Math.min(0.45, this.state.speed + 0.0003);

        return {
            speed: this.state.speed,
            spawnInterval: this.state.spawnInterval
        };
    }

    checkCollisions(playerMesh, obstacles) {
        // Authoritative collision check using pure math
        const playerSize = 1; // Player size
        const playerPos = playerMesh.position;
        const playerMinX = playerPos.x - playerSize/2;
        const playerMaxX = playerPos.x + playerSize/2;
        const playerMinZ = playerPos.z - playerSize/2;
        const playerMaxZ = playerPos.z + playerSize/2;

        for (const obstacle of obstacles) {
            const obstaclePos = obstacle.position;
            const obstacleSize = obstacle.geometry.parameters.width; // Get size from geometry
            const obstacleMinX = obstaclePos.x - obstacleSize/2;
            const obstacleMaxX = obstaclePos.x + obstacleSize/2;
            const obstacleMinZ = obstaclePos.z - obstacleSize/2;
            const obstacleMaxZ = obstaclePos.z + obstacleSize/2;

            // Check for intersection between the two boxes
            // Account for world wrapping by checking all possible positions
            const possibleXPositions = [
                obstacleMinX,
                obstacleMinX + this.state.worldWidth,
                obstacleMinX - this.state.worldWidth
            ];

            for (const baseX of possibleXPositions) {
                const wrappedMinX = baseX;
                const wrappedMaxX = baseX + obstacleSize;

                if (playerMinX < wrappedMaxX && 
                    playerMaxX > wrappedMinX && 
                    playerMinZ < obstacleMaxZ && 
                    playerMaxZ > obstacleMinZ) {
                    this.state.isGameOver = true;
                    return true;
                }
            }
        }
        return false;
    }

    updateScore() {
        if (!this.state.isGameOver && this.state.gameStarted) {
            this.state.score += 0.1;
            return this.state.score;
        }
        return this.state.score;
    }

    wrapCoordinate(x) {
        const halfWidth = this.state.worldWidth / 2;
        return ((x + halfWidth) % this.state.worldWidth) - halfWidth;
    }

    validatePlayerPosition(position) {
        // Validate and return corrected position if needed
        return {
            x: this.wrapCoordinate(position.x),
            y: position.y,
            z: position.z
        };
    }
} 