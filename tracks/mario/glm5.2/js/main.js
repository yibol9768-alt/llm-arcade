// ============================================================
// Main Entry Point - Game loop, screen management
// ============================================================

let game = null;
let lastTime = 0;
let accumulator = 0;
const FRAME_TIME = 1000 / 60; // 60 FPS
let running = false;

function init() {
    const canvas = document.getElementById('game-canvas');
    game = new Game(canvas);

    // Set up game loop
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!running) return;

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += delta;

    // Fixed timestep update
    while (accumulator >= FRAME_TIME) {
        update();
        accumulator -= FRAME_TIME;
    }

    // Render
    game.draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    // Handle global input (mute, pause)
    if (input.wasActionPressed('mute')) {
        audio.init();
        audio.resume();
        const muted = audio.toggleMute();
        const muteInd = document.getElementById('mute-indicator');
        if (muteInd) muteInd.style.display = muted ? 'block' : 'none';
    }

    if (game.state === STATE_TITLE) {
        if (input.wasActionPressed('enter') || input.wasActionPressed('jump')) {
            startGame();
        }
        input.clearFrame();
        return;
    }

    if (game.state === STATE_GAME_OVER) {
        if (input.wasActionPressed('enter')) {
            hideGameOverScreen();
            showTitleScreen();
            game.state = STATE_TITLE;
        }
        input.clearFrame();
        return;
    }

    if (game.state === STATE_WIN) {
        if (input.wasActionPressed('enter')) {
            hideWinScreen();
            showTitleScreen();
            game.state = STATE_TITLE;
        }
        input.clearFrame();
        return;
    }

    if (game.state === STATE_PAUSED) {
        if (input.wasActionPressed('pause') || input.wasActionPressed('enter')) {
            game.state = STATE_PLAYING;
            audio.playTheme();
        }
        input.clearFrame();
        return;
    }

    // Playing state
    if (input.wasActionPressed('pause')) {
        game.state = STATE_PAUSED;
        audio.stopMusic();
        input.clearFrame();
        return;
    }

    game.update();

    // Clear input frame state (per update, not per render)
    input.clearFrame();
}

function startGame() {
    hideTitleScreen();
    showGameScreen();
    audio.init();
    audio.resume();
    game.startGame();
}

// ---- Screen management ----
function showTitleScreen() {
    document.getElementById('title-screen').style.display = '';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
}

function hideTitleScreen() {
    document.getElementById('title-screen').style.display = 'none';
}

function showGameScreen() {
    document.getElementById('game-screen').style.display = '';
}

function showGameOverScreen() {
    document.getElementById('game-over-screen').style.display = '';
}

function hideGameOverScreen() {
    document.getElementById('game-over-screen').style.display = 'none';
}

function showWinScreen(score) {
    const el = document.getElementById('final-score');
    if (el) el.textContent = String(score);
    document.getElementById('win-screen').style.display = '';
}

function hideWinScreen() {
    document.getElementById('win-screen').style.display = 'none';
}

// ---- Start ----
window.addEventListener('load', function() {
    init();
});
