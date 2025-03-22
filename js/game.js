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
