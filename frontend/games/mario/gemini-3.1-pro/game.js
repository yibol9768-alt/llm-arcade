const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

// Game Constants
const GRAVITY = 0.5;
const FRICTION = 0.8;
const MAX_SPEED_X = 5;
const JUMP_POWER = -10;
const TILE_SIZE = 40;

// Game State
let gameState = {
    score: 0,
    lives: 3,
    isGameOver: false,
    camera: { x: 0 },
    keys: { right: false, left: false, up: false }
};

// Player Object
const player = {
    x: 100,
    y: 100,
    width: 30,
    height: 40,
    velX: 0,
    velY: 0,
    speed: 3,
    grounded: false,
    color: '#e52521', // Mario red
    direction: 1 // 1 for right, -1 for left
};

// Level Data (simple array representation)
// 0: empty, 1: ground/brick, 2: mystery block, 3: pipe, 4: goal
const levelMap = [
    "                                                                                                    ",
    "                                                                                                    ",
    "                                                                                                    ",
    "                                                                                                    ",
    "                                                                                                    ",
    "                                222                                                                 ",
    "                                                                                                    ",
    "                      2                                                                             ",
    "                                                                                                    ",
    "           11111                                            1111                  4                 ",
    "                                                                                                    ",
    "11111111111111111111111111111  111111111111   11111111111111111111111  11111111111111111111111111111"
];

let platforms = [];
let collectibles = [];
let enemies = [];

// Initialize Level
function initLevel() {
    platforms = [];
    collectibles = [];
    enemies = [];
    
    for (let row = 0; row < levelMap.length; row++) {
        for (let col = 0; col < levelMap[row].length; col++) {
            const tile = levelMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            
            if (tile === '1' || tile === '2') {
                platforms.push({ x, y, width: TILE_SIZE, height: TILE_SIZE, type: tile });
                // Add coin on top of mystery blocks occasionally
                if (tile === '2' && Math.random() > 0.5) {
                   collectibles.push({ x: x + 10, y: y - 30, width: 20, height: 20, type: 'coin', collected: false});
                }
            } else if (tile === '4') {
                platforms.push({ x, y: y - TILE_SIZE * 3, width: TILE_SIZE, height: TILE_SIZE * 4, type: 'goal' });
            }
            
            // Add goombas
            if (tile === '1' && Math.random() < 0.05 && col > 10) {
                enemies.push({
                    x: x, y: y - 30, width: 30, height: 30,
                    velX: -1, type: 'goomba', alive: true
                });
            }
        }
    }
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (gameState.isGameOver) return;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (player.grounded) {
            player.velY = JUMP_POWER;
            player.grounded = false;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = false;
});

restartBtn.addEventListener('click', resetGame);

// Collision Detection (AABB)
function checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
}

// Update Logic
function update() {
    if (gameState.isGameOver) return;

    // Apply Gravity
    player.velY += GRAVITY;
    
    // Apply Horizontal Movement
    if (gameState.keys.right) {
        if (player.velX < MAX_SPEED_X) player.velX += player.speed;
        player.direction = 1;
    } else if (gameState.keys.left) {
        if (player.velX > -MAX_SPEED_X) player.velX -= player.speed;
        player.direction = -1;
    } else {
        player.velX *= FRICTION; // Slow down
    }

    // Move player Y (for collision)
    player.y += player.velY;
    player.grounded = false;

    // Vertical Platform Collisions
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        if (checkCollision(player, p)) {
            // Hit from top (landing)
            if (player.velY > 0 && player.y + player.height - player.velY <= p.y + 5) {
                player.grounded = true;
                player.velY = 0;
                player.y = p.y - player.height;
            }
            // Hit from bottom (bumping head)
            else if (player.velY < 0 && player.y - player.velY >= p.y + p.height - 5) {
                player.velY = 0;
                player.y = p.y + p.height;
                if (p.type === '2') {
                   // Bumped mystery block
                   p.type = '1'; // Turn to normal block
                   gameState.score += 50;
                   updateUI();
                }
            }
            
            if (p.type === 'goal') {
                levelComplete();
            }
        }
    }

    // Move player X (for collision)
    player.x += player.velX;

    // Prevent going backwards past screen
    if (player.x < gameState.camera.x) {
        player.x = gameState.camera.x;
        player.velX = 0;
    }

    // Horizontal Platform Collisions
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        if (checkCollision(player, p)) {
            if (p.type === 'goal') continue;
            
            // Hit from left
            if (player.velX > 0) {
                player.velX = 0;
                player.x = p.x - player.width;
            }
            // Hit from right
            else if (player.velX < 0) {
                player.velX = 0;
                player.x = p.x + p.width;
            }
        }
    }

    // Collectibles
    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (!c.collected && checkCollision(player, c)) {
            c.collected = true;
            gameState.score += 100;
            updateUI();
        }
    }

    // Enemies update
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (!e.alive) continue;

        e.velY += GRAVITY;
        e.y += e.velY;
        
        let eGrounded = false;
        // Enemy vertical collision
        for (let j = 0; j < platforms.length; j++) {
             let p = platforms[j];
             if (p.type !== 'goal' && checkCollision(e, p)) {
                 if (e.velY > 0) {
                     e.velY = 0;
                     e.y = p.y - e.height;
                     eGrounded = true;
                 }
             }
        }

        e.x += e.velX;
        
        // Enemy horizontal collision
        for (let j = 0; j < platforms.length; j++) {
             let p = platforms[j];
             if (p.type !== 'goal' && checkCollision(e, p)) {
                  e.velX *= -1; // Reverse direction
                  if(e.velX > 0) e.x = p.x + p.width;
                  else e.x = p.x - e.width;
             }
        }

        // Enemy fall off screen
        if (e.y > canvas.height) e.alive = false;

        // Player vs Enemy
        if (checkCollision(player, e)) {
            // Player stomps enemy
            if (player.velY > 0 && player.y + player.height - player.velY < e.y + 10) {
                e.alive = false;
                player.velY = -8; // Bounce
                gameState.score += 200;
                updateUI();
            } else {
                // Player gets hit
                playerDie();
            }
        }
    }

    // Camera follow player (only scroll right)
    if (player.x > gameState.camera.x + canvas.width / 2) {
        gameState.camera.x = player.x - canvas.width / 2;
    }

    // Death by falling
    if (player.y > canvas.height) {
        playerDie();
    }
}

function playerDie() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        // Reset position slightly back or at start
        player.x = Math.max(100, gameState.camera.x + 50);
        player.y = 100;
        player.velX = 0;
        player.velY = 0;
    }
}

function gameOver() {
    gameState.isGameOver = true;
    gameOverScreen.style.display = 'flex';
}

function levelComplete() {
    gameState.isGameOver = true;
    gameOverScreen.style.display = 'flex';
    document.getElementById('game-over-text').innerText = "LEVEL CLEARED!";
}

function resetGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.isGameOver = false;
    gameState.camera.x = 0;
    
    player.x = 100;
    player.y = 100;
    player.velX = 0;
    player.velY = 0;
    
    gameOverScreen.style.display = 'none';
    document.getElementById('game-over-text').innerText = "GAME OVER";
    
    initLevel();
    updateUI();
}

function updateUI() {
    scoreDisplay.innerText = `SCORE: ${gameState.score}`;
    livesDisplay.innerText = `LIVES: ${gameState.lives}`;
}

// Draw Logic
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Camera translation
    ctx.save();
    ctx.translate(-gameState.camera.x, 0);

    // Draw Platforms
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        if (p.x + p.width < gameState.camera.x || p.x > gameState.camera.x + canvas.width) continue; // Culling

        if (p.type === '1') {
            ctx.fillStyle = '#8b4513'; // Brown brick/ground
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        } else if (p.type === '2') {
            ctx.fillStyle = '#ffd700'; // Gold block
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = '#000';
            ctx.fillText("?", p.x + 15, p.y + 25);
        } else if (p.type === 'goal') {
            ctx.fillStyle = '#228b22'; // Green flagpole
            ctx.fillRect(p.x + p.width/2 - 2, p.y, 4, p.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x + p.width/2, p.y, 30, 20); // flag
        }
    }

    // Draw Collectibles
    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (!c.collected) {
            ctx.fillStyle = '#ffdf00'; // Coin yellow
            ctx.beginPath();
            ctx.arc(c.x + c.width/2, c.y + c.height/2, c.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Enemies
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (e.alive) {
            ctx.fillStyle = '#8b0000'; // Dark red goomba
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    }

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw simple hat/face direction
    ctx.fillStyle = '#000';
    if (player.direction === 1) {
        ctx.fillRect(player.x + 20, player.y + 10, 5, 5); // eye right
    } else {
        ctx.fillRect(player.x + 5, player.y + 10, 5, 5); // eye left
    }

    ctx.restore();
}

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
initLevel();
gameLoop();