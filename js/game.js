import * as THREE from 'three';
import { GameClient } from './GameClient.js';

// Create game container
const gameContainer = document.createElement('div');
gameContainer.id = 'gameContainer';
document.body.appendChild(gameContainer);

// Create score display
const scoreDiv = document.createElement('div');
scoreDiv.style.position = 'fixed';
scoreDiv.style.top = '20px';
scoreDiv.style.left = '20px';
scoreDiv.style.color = 'white';
scoreDiv.style.fontSize = '24px';
scoreDiv.innerHTML = 'Score: <span id="scoreValue">0</span>';
document.body.appendChild(scoreDiv);

// Initialize and start the game
const game = new GameClient();
game.initializeGame();
game.animate(); 