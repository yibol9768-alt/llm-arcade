// ============================================================
// Level Data - World 1-1 style layout
// ============================================================

const TILE = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION_COIN: 3,
    QUESTION_MUSHROOM: 4,
    QUESTION_1UP: 5,
    QUESTION_MULTI: 6,
    USED: 7,
    HARD: 8,
    PIPE_TL: 9,
    PIPE_TR: 10,
    PIPE_BL: 11,
    PIPE_BR: 12,
    COIN: 13,
    FLAGPOLE_TOP: 14,
    FLAGPOLE: 15,
    FLAGPOLE_BASE: 16,
    CASTLE: 17,
    GROUND_TOP: 18,  // Ground with grass top
    GROUND_FILL: 19, // Ground without grass
};

function buildLevel1() {
    const W = 224; // tiles wide
    const H = 15;  // tiles tall (0=top, 14=bottom)
    const GROUND_Y = 13; // ground starts at row 13

    // Initialize empty grid
    const grid = [];
    for (let r = 0; r < H; r++) {
        grid.push(new Array(W).fill(TILE.EMPTY));
    }

    // Fill ground (with gaps)
    const gaps = [
        [69, 71],   // gap 1 (3 tiles wide)
        [86, 88],   // gap 2 (3 tiles wide)
        [153, 155], // gap 3 (3 tiles wide)
    ];

    function isGap(col) {
        for (const [start, end] of gaps) {
            if (col >= start && col <= end) return true;
        }
        return false;
    }

    for (let c = 0; c < W; c++) {
        if (!isGap(c)) {
            grid[GROUND_Y][c] = TILE.GROUND_TOP;
            grid[GROUND_Y + 1][c] = TILE.GROUND_FILL;
        }
    }

    // End ground at flagpole area (castle)
    // Ground continues through to castle

    // --- Question blocks and brick blocks ---
    // First ? block (coin) at col 16, row 9
    grid[9][16] = TILE.QUESTION_COIN;

    // Brick row at col 20-24, row 9
    grid[9][20] = TILE.BRICK;
    grid[9][21] = TILE.QUESTION_MUSHROOM; // mushroom!
    grid[9][22] = TILE.BRICK;
    grid[9][23] = TILE.QUESTION_COIN;
    grid[9][24] = TILE.BRICK;

    // Floating coins above bricks
    grid[6][21] = TILE.COIN;
    grid[6][22] = TILE.COIN;
    grid[6][23] = TILE.COIN;

    // Question block (coin) at col 22, row 5 (high one)
    grid[5][22] = TILE.QUESTION_COIN;

    // --- Pipes ---
    // Pipe 1 (height 2) at col 28
    function setPipe(col, height) {
        const topRow = GROUND_Y - height;
        grid[topRow][col] = TILE.PIPE_TL;
        grid[topRow][col + 1] = TILE.PIPE_TR;
        for (let r = topRow + 1; r < GROUND_Y; r++) {
            grid[r][col] = TILE.PIPE_BL;
            grid[r][col + 1] = TILE.PIPE_BR;
        }
    }

    setPipe(28, 2);
    setPipe(38, 3);
    setPipe(46, 4);
    setPipe(57, 4);

    // --- Goombas ---
    // Goomba near pipe 2
    // (enemies handled separately in entity array)

    // Brick cluster around col 77-80, row 9
    grid[9][77] = TILE.BRICK;
    grid[9][78] = TILE.QUESTION_COIN;
    grid[9][79] = TILE.QUESTION_MUSHROOM;
    grid[9][80] = TILE.BRICK;

    // High brick at col 80, row 5
    grid[5][80] = TILE.QUESTION_COIN;

    // Coins floating
    grid[6][78] = TILE.COIN;
    grid[6][79] = TILE.COIN;

    // Brick cluster around col 91-94
    grid[9][91] = TILE.BRICK;
    grid[9][92] = TILE.QUESTION_COIN;
    grid[9][93] = TILE.QUESTION_1UP;  // 1-up mushroom!
    grid[9][94] = TILE.BRICK;

    // Floating coins
    grid[6][92] = TILE.COIN;
    grid[6][93] = TILE.COIN;
    grid[6][94] = TILE.COIN;

    // Question blocks at row 5
    grid[5][94] = TILE.QUESTION_COIN;

    // Brick at col 100, row 9
    grid[9][100] = TILE.BRICK;
    grid[9][101] = TILE.QUESTION_MULTI; // multi-coin block
    grid[9][102] = TILE.BRICK;

    // Brick at col 106, row 9 (solo)
    grid[9][106] = TILE.BRICK;
    grid[9][109] = TILE.BRICK;
    grid[9][110] = TILE.QUESTION_COIN;
    grid[9][111] = TILE.BRICK;

    // --- Hard blocks (staircase) ---
    // Ascending staircase before gap 3 (col 134-138)
    //    H
    //   HH
    //  HHH
    // HHHH
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            grid[GROUND_Y - 1 - j][134 + i] = TILE.HARD;
        }
    }

    // Descending staircase after gap 3 (col 160-164)
    // HHHH
    //  HHH
    //   HH
    //    H
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4 - i; j++) {
            grid[GROUND_Y - 1 - j][160 + i] = TILE.HARD;
        }
    }

    // Second ascending staircase (col 178-182)
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            grid[GROUND_Y - 1 - j][178 + i] = TILE.HARD;
        }
    }

    // --- Pipe before staircase ---
    // (No pipe here - bricks occupy this area)

    // --- Flagpole ---
    const flagCol = 196;
    grid[3][flagCol] = TILE.FLAGPOLE_TOP;
    for (let r = 4; r < GROUND_Y; r++) {
        grid[r][flagCol] = TILE.FLAGPOLE;
    }
    grid[GROUND_Y][flagCol] = TILE.FLAGPOLE_BASE;

    // --- Castle ---
    const castleCol = 208;
    // Castle is 5 tiles wide, 5 tiles tall
    for (let r = GROUND_Y - 5; r < GROUND_Y; r++) {
        for (let c = castleCol; c < castleCol + 5; c++) {
            if (r < H && c < W) {
                grid[r][c] = TILE.CASTLE;
            }
        }
    }

    // --- Enemies ---
    const enemies = [
        { type: 'goomba', x: 22, y: GROUND_Y - 1 },
        { type: 'goomba', x: 40, y: GROUND_Y - 1 },
        { type: 'goomba', x: 51, y: GROUND_Y - 1 },
        { type: 'goomba', x: 52, y: GROUND_Y - 1 },
        { type: 'koopa', x: 63, y: GROUND_Y - 2 },
        { type: 'goomba', x: 80, y: GROUND_Y - 5 }, // on bricks area - actually place on ground
        { type: 'goomba', x: 82, y: GROUND_Y - 1 },
        { type: 'goomba', x: 97, y: GROUND_Y - 1 },
        { type: 'goomba', x: 98, y: GROUND_Y - 1 },
        { type: 'koopa', x: 114, y: GROUND_Y - 2 },
        { type: 'goomba', x: 130, y: GROUND_Y - 4 },
        { type: 'goomba', x: 172, y: GROUND_Y - 1 },
        { type: 'goomba', x: 173, y: GROUND_Y - 1 },
    ];

    // Fix goomba positions - ensure they're on ground
    for (const e of enemies) {
        if (e.type === 'goomba') {
            // Place on top of ground
            e.x = e.x;
            e.y = GROUND_Y - 1;
        }
    }

    // --- Scenery (background) ---
    const scenery = [
        // Hills
        { type: 'hill', x: 0, y: GROUND_Y, size: 'large' },
        { type: 'hill', x: 48, y: GROUND_Y, size: 'small' },
        { type: 'hill', x: 96, y: GROUND_Y, size: 'large' },
        { type: 'hill', x: 144, y: GROUND_Y, size: 'small' },
        { type: 'hill', x: 176, y: GROUND_Y, size: 'large' },

        // Clouds
        { type: 'cloud', x: 8, y: 2, size: 'small' },
        { type: 'cloud', x: 19, y: 1, size: 'large' },
        { type: 'cloud', x: 36, y: 2, size: 'small' },
        { type: 'cloud', x: 56, y: 1, size: 'small' },
        { type: 'cloud', x: 67, y: 2, size: 'large' },
        { type: 'cloud', x: 84, y: 1, size: 'small' },
        { type: 'cloud', x: 104, y: 2, size: 'large' },
        { type: 'cloud', x: 120, y: 1, size: 'small' },
        { type: 'cloud', x: 140, y: 2, size: 'small' },
        { type: 'cloud', x: 155, y: 1, size: 'large' },
        { type: 'cloud', x: 175, y: 2, size: 'small' },
        { type: 'cloud', x: 190, y: 1, size: 'large' },

        // Bushes
        { type: 'bush', x: 11, y: GROUND_Y, size: 'small' },
        { type: 'bush', x: 41, y: GROUND_Y, size: 'large' },
        { type: 'bush', x: 68, y: GROUND_Y, size: 'small' },
        { type: 'bush', x: 90, y: GROUND_Y, size: 'medium' },
        { type: 'bush', x: 118, y: GROUND_Y, size: 'large' },
        { type: 'bush', x: 150, y: GROUND_Y, size: 'small' },
        { type: 'bush', x: 180, y: GROUND_Y, size: 'large' },
    ];

    return {
        width: W,
        height: H,
        groundY: GROUND_Y,
        grid: grid,
        enemies: enemies,
        scenery: scenery,
        flagCol: flagCol,
        castleCol: castleCol,
        startX: 3 * TILE_SIZE,
        startY: (GROUND_Y - 2) * TILE_SIZE,
        levelName: 'WORLD 1-1',
    };
}
