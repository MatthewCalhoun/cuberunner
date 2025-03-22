import * as THREE from 'three';
import { GameClient } from './GameClient.js';

// Create game container
const gameContainer = document.createElement('div');
gameContainer.id = 'gameContainer';
document.body.appendChild(gameContainer);


// Initialize and start the game
const game = new GameClient();
game.initializeGame();
game.animate(); 

class GameServer {
    constructor() {
        this.clients = new Map(); // Track connected clients
        this.gameStates = new Map(); // Track each client's game state
    }

    initializeClientState(clientId) {
        this.gameStates.set(clientId, {
            id: clientId,
            score: 0,
            isGameOver: false,
            speed: 0.3,
            spawnInterval: 45,
            gameStarted: false,
            worldWidth: 60,
            position: { x: 0, y: -0.5, z: 5 },
            lastUpdate: Date.now()
        });
    }
} 