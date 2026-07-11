// ============================================================
// Game Constants
// ============================================================

const TILE_SIZE = 16;
const SCREEN_W = 256;       // 16 tiles visible (NES resolution)
const SCREEN_H = 240;       // 15 tiles visible (NES resolution)
const RENDER_W = SCREEN_W;  // Canvas internal resolution
const RENDER_H = SCREEN_H;

const GRAVITY = 0.5;
const MAX_FALL = 12;

// Player physics
const WALK_ACCEL = 0.15;
const RUN_ACCEL = 0.22;
const WALK_MAX = 2.0;
const RUN_MAX = 3.5;
const FRICTION = 0.12;
const JUMP_VEL = -10.5;
const JUMP_VEL_RUN = -11.5;
const JUMP_HOLD_GRAVITY = 0.2;  // Reduced gravity while holding jump
const MAX_JUMP_HOLD = 18;       // Frames you can hold jump

// Game states
const STATE_TITLE = 'title';
const STATE_PLAYING = 'playing';
const STATE_DYING = 'dying';
const STATE_LEVEL_COMPLETE = 'levelComplete';
const STATE_GAME_OVER = 'gameOver';
const STATE_WIN = 'win';
const STATE_PAUSED = 'paused';

// Directions
const DIR_LEFT = -1;
const DIR_RIGHT = 1;

// Colors (NES palette approximation)
const COLORS = {
    transparent: null,
    black: '#000000',
    white: '#FCFCFC',
    red: '#E52521',
    darkRed: '#A01010',
    skin: '#FFA876',
    darkSkin: '#D88040',
    brown: '#6D2604',
    darkBrown: '#3D1602',
    overalls: '#4A6ACE',
    darkOveralls: '#1A3A8E',
    yellow: '#FBC02D',
    darkYellow: '#C89000',
    green: '#43A047',
    darkGreen: '#1B6020',
    lightGreen: '#80D050',
    blue: '#5C94FC',
    lightBlue: '#AACCFF',
    orange: '#FF8000',
    gray: '#BCBCBC',
    darkGray: '#7C7C7C',
    pipeGreen: '#00A800',
    pipeDarkGreen: '#005800',
    pipeLight: '#80F880',
    tan: '#E0A060',
    brick: '#C87000',
    brickDark: '#8A4800',
    brickLine: '#FFD8A8',
    coinYellow: '#FFD700',
    coinOrange: '#FFA000',
    flagWhite: '#FFFFFF',
    flagGreen: '#00B800',
    cloudWhite: '#FFFFFF',
    bushGreen: '#00A800',
    hillGreen: '#00B800',
};
