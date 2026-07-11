// ============================================================
// Sprite System - Pixel art definitions and rendering
// ============================================================

const COLOR_MAP = {
    '.': null,           // transparent
    ' ': null,
    'k': '#000000',      // black (eyes, mustache, outline)
    'w': '#FCFCFC',      // white
    'r': '#E52521',      // red (hat, shirt)
    'R': '#A01010',      // dark red
    's': '#FFA876',      // skin
    'S': '#D88040',      // dark skin / shadow
    'b': '#6D2604',      // brown (hair, shoes)
    'B': '#3D1602',      // dark brown
    'o': '#4A6ACE',      // overalls blue
    'O': '#2A4A8E',      // dark overalls
    'y': '#FBC02D',      // yellow (buttons, coin)
    'Y': '#C89000',      // dark yellow
    'g': '#43A047',      // green
    'G': '#1B6020',      // dark green
    'l': '#80D050',      // light green
    'p': '#00A800',      // pipe green
    'P': '#006800',      // pipe dark green
    'q': '#80F880',      // pipe light highlight
    't': '#E0A060',      // tan
    'T': '#B07040',      // dark tan
    'c': '#C87000',      // brick / ground
    'C': '#8A4800',      // brick dark
    'n': '#FFD8A8',      // light line
    'd': '#BCBCBC',      // gray
    'D': '#7C7C7C',      // dark gray
    'f': '#FF8000',      // fire orange
    'F': '#FFD700',      // gold
    'm': '#E52521',      // mushroom red
    'h': '#FCFCFC',      // white spots
    'u': '#FFA876',      // stem
    'e': '#FCC060',      // question block light
    'E': '#B06010',      // question block dark
    'i': '#000000',      // question mark
    'v': '#8A4800',      // used block
    'V': '#5A2800',      // used block dark
    'a': '#FFD700',      // coin bright
    'A': '#C89000',      // coin dark
};

// ---- Small Mario (16x16) ----
const SPR_MARIO_SMALL_STAND = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "..rrroorrr......",
    ".rrrroorrrr.....",
    "rrrrroorrrrr....",
    "ssrrrooorrss....",
    "ssssooorrss.....",
    "..ssoooooo......",
    "..ooo..ooo......",
    ".ooo....ooo.....",
    ".bb......bb.....",
];

const SPR_MARIO_SMALL_WALK1 = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "..rrroorrr.s....",
    ".rrrroorrroos...",
    "rrrrroorrrooo...",
    "ssrrrooorrooss..",
    "ssssooorrrooss..",
    "..ssooooooo.....",
    "...ooo..ooo.....",
    "..ooo....ooo....",
    "..bb......bb....",
];

const SPR_MARIO_SMALL_WALK2 = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "...rrorrr.......",
    "..rrroorrro.....",
    ".rrrroorrrr.....",
    "ssrrroorrross...",
    "ssssoorrooss....",
    "..ssooooooo.....",
    ".....ooo........",
    "....ooo.........",
    "...bbb.bbb......",
];

const SPR_MARIO_SMALL_WALK3 = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "s.rrorrr.s......",
    "sorrrorrroo.....",
    "oorrrrorrooo....",
    "ossrrroorrooss..",
    "ossssoorrooss...",
    "oo.ssoooooo.....",
    "....ooo..o......",
    "...ooo...ooo....",
    "..bbb.....bbb...",
];

const SPR_MARIO_SMALL_JUMP = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "..rrroorrross...",
    ".rrrroorrroossss",
    "rrrrroorrrroosss",
    "ssrrrooorrrroos.",
    "ssssooorrooss...",
    "..ssoooooooss...",
    "...ooo..ooo.....",
    "..ooo....ooo....",
    "..bb......bb....",
];

const SPR_MARIO_SMALL_DEAD = [
    "....rrrr........",
    "...rrrrrrrr.....",
    "...bbsskks......",
    "..bsbsskksk.....",
    "..bsbsssssk.....",
    "..bbssssss......",
    "....ssss........",
    "..rrroorrr......",
    ".rrrroorrrr.....",
    "rrrrroorrrrr....",
    "ssrrrooorrss....",
    "ssssooorrss.....",
    "..ssoooooo......",
    "..ooo..ooo......",
    ".ooo....ooo.....",
    ".bb......bb.....",
];

// ---- Super Mario (16x32) ----
const SPR_MARIO_SUPER_STAND = [
    "......rrrr........",
    ".....rrrrrrrr.....",
    ".....bbbsskks.....",
    "....bsbsssksks....",
    "....bsbsssksss....",
    "....bbbssssss.....",
    "......ssssss......",
    "......skskss......",
    "....ssssssss......",
    "...rrroorrro......",
    "..rrrroorrroo.....",
    ".rrrrroorrrooo....",
    "rrrrrroorrrooo....",
    "ssrrrroorroooss...",
    "sssrrroorroooss...",
    ".sssoooorrooss....",
    "...soooooooos.....",
    "...soooooooos.....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "..ssoooooooooss...",
    "..soo..ooo..oos...",
    ".soo...ooo...oos..",
    ".sbb...bbb...bbs..",
    ".bbb...bbb...bbb..",
    ".bbb...bbb...bbb..",
];

const SPR_MARIO_SUPER_WALK1 = [
    "......rrrr........",
    ".....rrrrrrrr.....",
    ".....bbbsskks.....",
    "....bsbsssksks....",
    "....bsbsssksss....",
    "....bbbssssss.....",
    "......ssssss......",
    "......skskss......",
    "....ssssssss......",
    "...rrroorrro.s....",
    "..rrrroorrrooos...",
    ".rrrrroorrroooos..",
    "rrrrrroorrroooos..",
    "ssrrrroorrooosss..",
    "sssrrroorrooosss..",
    ".sssoooorrooss....",
    "...sooooooooss....",
    "...soooooooos.....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...sooooooooos....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "..ssooooooooss....",
    "...oo.ooo.oo......",
    "..ooo..o..ooo.....",
    ".bbb....b...bb....",
    ".bbb.......bbb....",
    ".bbb.......bbb....",
];

const SPR_MARIO_SUPER_WALK2 = [
    "......rrrr........",
    ".....rrrrrrrr.....",
    ".....bbbsskks.....",
    "....bsbsssksks....",
    "....bsbsssksss....",
    "....bbbssssss.....",
    "......ssssss......",
    "......skskss......",
    "....ssssssss......",
    "...rrorrr.........",
    "..rrroorrro.......",
    ".rrrroorrroo......",
    "rrrrroorrrooo.....",
    "ssrrroorroooss....",
    "ssssooorrooss.....",
    ".sssoooorroos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "..ssooooooooss....",
    "..sooooooooooos...",
    "..soo..oooo..oos..",
    "..soo..ooo...oos..",
    ".sbb...bbb...bbs..",
    ".bbb...bbb...bbb..",
    ".bbb...bbb...bbb..",
];

const SPR_MARIO_SUPER_JUMP = [
    "......rrrr........",
    ".....rrrrrrrr.....",
    ".....bbbsskks.....",
    "....bsbsssksks....",
    "....bsbsssksss....",
    "....bbbssssss.....",
    "......ssssss......",
    "......skskss......",
    "....ssssssss......",
    "...rrroorrross....",
    "..rrrroorrrooss...",
    ".rrrrroorrroooss..",
    "rrrrrroorrrooooss.",
    "ssrrrroorrooossss.",
    "sssrrroorrooosss..",
    ".sssoooorrooss....",
    "...sooooooooss....",
    "...sooooooooss....",
    "...sooyyooooss....",
    "...sooyyooooss....",
    "...soooooooooss...",
    "...sooooooooos....",
    "...sooyyoooos.....",
    "...sooyyoooos.....",
    "...soooooooos.....",
    "...soooooooos.....",
    "..ssoooooooooss...",
    "..soo..ooo..oos...",
    ".soo...ooo...oos..",
    ".sbb...bbb...bbs..",
    ".bbb...bbb...bbb..",
    ".bbb...bbb...bbb..",
];

const SPR_MARIO_SUPER_CROUCH = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "......rrrr......",
    ".....rrrrrrrr...",
    ".....bbbsskks...",
    "....bsbsssksks..",
    "....bsbsssksss..",
    "....bbbssssss...",
    "......ssssss....",
    "..ssssssssssss..",
    "..ssoorrroorss..",
    "..ssoorrroorss..",
    "..ssooyyoooyss..",
    "..ssooyyoooyss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..ssooooooooss..",
    "..sooo..ooo..os.",
    ".sbb....b....bbs",
    ".bbb...bbb...bbb",
    ".bbb...bbb...bbb",
    ".bbb...bbb...bbb",
];

// ---- Goomba (16x16) ----
const SPR_GOOMBA1 = [
    "................",
    "....kkkkkkkk....",
    "...kcccccccck...",
    "..kcccccCCCCck..",
    ".kcCCwwCCwwCCck.",
    ".kcwwCCwwCCwwck.",
    ".kcwwCCwwCCwwck.",
    ".kcCCCCCCCCCCck.",
    "..kcCkCCCCkCCk..",
    "...kkkkkkkkkk...",
    "..kkkkkkkkkkkk..",
    ".kkkkkkkkkkkkkk.",
    ".kkkk....kkkkkk.",
    ".kkk......kkkkk.",
    ".kkk......kkkkk.",
    ".kk........kkk..",
];

const SPR_GOOMBA2 = [
    "................",
    "....kkkkkkkk....",
    "...kcccccccck...",
    "..kcccccCCCCck..",
    ".kcCCwwCCwwCCck.",
    ".kcwwCCwwCCwwck.",
    ".kcwwCCwwCCwwck.",
    ".kcCCCCCCCCCCck.",
    "..kcCkCCCCkCCk..",
    "...kkkkkkkkkk...",
    "..kkkkkkkkkkkk..",
    ".kkkkkkkkkkkkkk.",
    ".kkkk....kkkkkk.",
    "..kkk....kkkkk..",
    "..kkk....kkkkk..",
    ".kkk......kkk...",
];

const SPR_GOOMBA_SQUISHED = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kcwwCCwwCCwwck.",
    ".kcwwCCwwCCwwck.",
    ".kcCCCCCCCCCCck.",
    ".kkkkkkkkkkkkkk.",
];

// ---- Koopa Troopa (16x24) ----
const SPR_KOOPA_WALK1 = [
    "................",
    "................",
    "....ggggg.......",
    "...gggggggg.....",
    "...ggggwgggg....",
    "...gggwwwggg....",
    "...ggggggggg....",
    "...ggGgggGgg....",
    "....gggggg......",
    "....GGGGGG......",
    "...GGGGGGGG.....",
    "..GGGggggGGG....",
    ".GGGgssssgGGG...",
    ".GGggssssggGG...",
    ".GggssssssggG...",
    ".gggssssssggg...",
    "..gssssssssg....",
    "..sssssssss.....",
    "..sssss.sss.....",
    "...ss...ss......",
    "...sss.sss......",
    "....sssss.......",
    "................",
    "................",
];

const SPR_KOOPA_WALK2 = [
    "................",
    "................",
    "....ggggg.......",
    "...gggggggg.....",
    "...ggggwgggg....",
    "...gggwwwggg....",
    "...ggggggggg....",
    "...ggGgggGgg....",
    "....gggggg......",
    "....GGGGGG......",
    "...GGGGGGGG.....",
    "..GGGggggGGG....",
    ".GGGgssssgGGG...",
    ".GGggssssggGG...",
    ".GggssssssggG...",
    ".gggssssssggg...",
    "..gssssssssg....",
    "..sssssssss.....",
    "...ssssssss.....",
    "....sssss.......",
    "....sssss.......",
    "...ss.s.ss......",
    "................",
    "................",
];

const SPR_KOOPA_SHELL = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....gggggg......",
    "...gGGGGGGg.....",
    "..gGGgwwgGGg....",
    ".gGGgwwwgGGg....",
    "gGGGgwwwwgGGGg..",
    "gGGggwwwwggGGg..",
    "gGGggggggggGGg..",
    "gGGGGGGGGGGGGg..",
    ".gGGGGGGGGGGg...",
    "..gGGGGGGGGg....",
    "...gggggggg.....",
    "................",
    "................",
    "................",
    "................",
    "................",
];

const SPR_KOOPA_SHELL_SPIN = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....gggggg......",
    "...gGgGGgGg.....",
    "..gGGgwGwgGg....",
    ".gGgGwGwGgGg....",
    "gGGGgwGwgGGGg...",
    "gGgGgwGwgGgGg...",
    "gGgGGGgGGGgGg...",
    "gGGGGGGGGGGGg...",
    ".gGGGGGGGGGg....",
    "..gGGGGGGGg.....",
    "...ggggggg......",
    "................",
    "................",
    "................",
    "................",
    "................",
];

// ---- Coin (16x16) - 4 frames ----
const SPR_COIN1 = [
    "................",
    "................",
    "......aaa.......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    ".....aAAAa......",
    "......aaa.......",
    "................",
    "................",
];

const SPR_COIN2 = [
    "................",
    "................",
    ".......aa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    "......aAa.......",
    ".......aa.......",
    "................",
    "................",
];

const SPR_COIN3 = [
    "................",
    "................",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "........a.......",
    "................",
    "................",
];

const SPR_COIN4 = SPR_COIN2; // mirror of frame 2

// ---- Mushroom (16x16) ----
const SPR_MUSHROOM = [
    "................",
    "...mmmmmmmm.....",
    "..mhhmmmmhhmm...",
    ".mhhmmmmmmhhmm..",
    ".mhhmmmmmmhhmm..",
    ".mmmmmmmmmmmmm..",
    ".mmmmhhhhmmmmm..",
    ".mmmhhhhhhmmmm..",
    ".mmhhhhhhhhmmm..",
    ".mmmmmmmmmmmmm..",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "................",
    "................",
];

// ---- 1-Up Mushroom (16x16) ----
const SPR_1UP_MUSHROOM = [
    "................",
    "...gggggggg.....",
    "..gwwggggwwgg...",
    ".gwwggggggwwgg..",
    ".gwwggggggwwgg..",
    ".ggggggggggggg..",
    ".ggggwwwwggggg..",
    ".gggwwwwwwgggg..",
    ".ggwwwwwwwwggg..",
    ".ggggggggggggg..",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "..uuuuuuuuuuu...",
    "................",
    "................",
];

// ---- Fire Flower (16x16) ----
const SPR_FIRE_FLOWER = [
    "................",
    "...rrrrrrrr.....",
    "..rwwrrrrwwrr...",
    ".rwwrrrrrrwwrr..",
    ".rwwrrrrrrwwrr..",
    ".rrrrrrrrrrrrr..",
    ".rrrrwwwwrrrrr..",
    ".rrrwwwwwwrrrr..",
    ".rrwwwwwwwwrrr..",
    ".rrrrrrrrrrrrr..",
    "...gggggggg.....",
    "...gggGGgggg....",
    "...gGGGGGGg.....",
    "...ggGGGGgg.....",
    "....ggGGgg......",
    "....ggGGgg......",
];

// ---- Star (16x16) ----
const SPR_STAR = [
    "................",
    ".......yy.......",
    "......yyyy......",
    "......yyyy......",
    ".....yyyyyy.....",
    ".yyywwyyyyyy....",
    ".yywwwwyyyyy....",
    ".wwwwwwwyyyy....",
    "wwwwwwwwyyyy....",
    ".wwwwwwyyyy.....",
    ".wwwwwyyyy......",
    "..wwwyyyyy......",
    "...yyyyyy.......",
    "...yyyyy........",
    "...yyy..........",
    "...y............",
];

// ---- Fireball (8x8) ----
const SPR_FIREBALL = [
    "..ffff..",
    ".fFFffF.",
    ".FFFwFF.",
    "fFFwwFFf",
    "fFFwwFFf",
    ".FFFwFF.",
    ".fFFffF.",
    "..ffff..",
];

// ---- Brick piece (8x8) ----
const SPR_BRICK_PIECE = [
    ".cccccc.",
    "cCCCCCCc",
    "cCnnCCnc",
    "ccCnnCcc",
    "cCCCCCCc",
    "cCCnnCCc",
    "ccCCCCcc",
    ".cccccc.",
];

// ---- Score popup ----
const SPR_SCORE_100 = [
    "....yyyy....",
    "...y..yy.y..",
    "..y...yy.y..",
    ".....yy..y..",
    "....yy...y..",
    "...yyyyyyyy.",
    "............",
    "............",
];

// ============================================================
// Block sprites drawn programmatically for better quality
// ============================================================

function drawQuestionBlock(ctx, x, y, frame) {
    // frame 0=bright, 1=medium, 2=dark (animated)
    const brightness = [1.0, 0.85, 0.7][frame] || 1.0;
    const base = adjustBrightness('#FCC060', brightness);
    const dark = adjustBrightness('#B06010', brightness);
    const rivet = '#000000';

    // Main fill
    ctx.fillStyle = base;
    ctx.fillRect(x, y, 16, 16);
    // Border (darker)
    ctx.fillStyle = dark;
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);
    // Corner rivets
    ctx.fillRect(x + 1, y + 1, 2, 2);
    ctx.fillRect(x + 13, y + 1, 2, 2);
    ctx.fillRect(x + 1, y + 13, 2, 2);
    ctx.fillRect(x + 13, y + 13, 2, 2);
    // Question mark
    ctx.fillStyle = rivet;
    // Top arc of ?
    ctx.fillRect(x + 5, y + 3, 6, 1);
    ctx.fillRect(x + 4, y + 4, 1, 2);
    ctx.fillRect(x + 11, y + 4, 1, 2);
    ctx.fillRect(x + 10, y + 6, 2, 1);
    ctx.fillRect(x + 8, y + 7, 2, 1);
    ctx.fillRect(x + 7, y + 8, 2, 1);
    // Dot
    ctx.fillRect(x + 7, y + 11, 2, 2);
}

function drawUsedBlock(ctx, x, y) {
    ctx.fillStyle = '#8A4800';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#5A2800';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);
    ctx.fillRect(x + 1, y + 1, 2, 2);
    ctx.fillRect(x + 13, y + 1, 2, 2);
    ctx.fillRect(x + 1, y + 13, 2, 2);
    ctx.fillRect(x + 13, y + 13, 2, 2);
}

function drawBrickBlock(ctx, x, y) {
    // Base
    ctx.fillStyle = '#C87000';
    ctx.fillRect(x, y, 16, 16);
    // Dark border
    ctx.fillStyle = '#8A4800';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);
    // Light highlights (top and left edges)
    ctx.fillStyle = '#FFD8A8';
    ctx.fillRect(x + 1, y + 1, 14, 1);
    ctx.fillRect(x + 1, y + 1, 1, 6);
    // Brick lines (mortar)
    ctx.fillStyle = '#8A4800';
    // Horizontal line at row 7
    ctx.fillRect(x + 1, y + 7, 14, 1);
    // Vertical lines (offset pattern)
    ctx.fillRect(x + 7, y + 1, 1, 6);
    ctx.fillRect(x + 3, y + 8, 1, 6);
    ctx.fillRect(x + 11, y + 8, 1, 6);
    // Inner highlights
    ctx.fillStyle = '#FFD8A8';
    ctx.fillRect(x + 1, y + 8, 2, 1);
    ctx.fillRect(x + 8, y + 8, 2, 1);
}

function drawGroundBlock(ctx, x, y) {
    // Base tan/brown
    ctx.fillStyle = '#E0A060';
    ctx.fillRect(x, y, 16, 16);
    // Darker bottom and right
    ctx.fillStyle = '#B07040';
    ctx.fillRect(x, y + 14, 16, 2);
    ctx.fillRect(x + 14, y, 2, 16);
    // Texture dots
    ctx.fillStyle = '#B07040';
    ctx.fillRect(x + 2, y + 2, 1, 1);
    ctx.fillRect(x + 8, y + 4, 1, 1);
    ctx.fillRect(x + 5, y + 9, 1, 1);
    ctx.fillRect(x + 11, y + 11, 1, 1);
    // Light highlights
    ctx.fillStyle = '#FFD8A8';
    ctx.fillRect(x + 1, y, 13, 1);
    ctx.fillRect(x, y + 1, 1, 12);
}

function drawHardBlock(ctx, x, y) {
    // Solid block (used for stairs, etc.)
    ctx.fillStyle = '#B07040';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#8A4800';
    ctx.fillRect(x, y + 14, 16, 2);
    ctx.fillRect(x + 14, y, 2, 16);
    ctx.fillStyle = '#E0A060';
    ctx.fillRect(x + 1, y + 1, 12, 12);
    ctx.fillStyle = '#FFD8A8';
    ctx.fillRect(x + 1, y + 1, 11, 1);
    ctx.fillRect(x + 1, y + 1, 1, 11);
    // Texture
    ctx.fillStyle = '#B07040';
    ctx.fillRect(x + 5, y + 5, 2, 2);
    ctx.fillRect(x + 9, y + 9, 2, 2);
}

function drawPipeTopLeft(ctx, x, y) {
    // Pipe top-left quadrant (16x16)
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x, y, 16, 16);
    // Lip overhang (wider at top)
    ctx.fillStyle = '#006800';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    // Highlight
    ctx.fillStyle = '#80F880';
    ctx.fillRect(x + 2, y + 1, 2, 14);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + 14, y + 1, 2, 14);
    // Lip bottom edge
    ctx.fillStyle = '#006800';
    ctx.fillRect(x, y + 13, 16, 1);
}

function drawPipeTopRight(ctx, x, y) {
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x + 15, y, 1, 16);
    // Highlight (partial)
    ctx.fillStyle = '#80F880';
    ctx.fillRect(x, y + 1, 1, 14);
    // Darker right side
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + 13, y + 1, 2, 14);
    ctx.fillRect(x, y + 13, 16, 1);
}

function drawPipeBodyLeft(ctx, x, y) {
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);
    ctx.fillStyle = '#80F880';
    ctx.fillRect(x + 2, y, 2, 16);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + 13, y, 2, 16);
}

function drawPipeBodyRight(ctx, x, y) {
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);
    ctx.fillStyle = '#80F880';
    ctx.fillRect(x + 1, y, 1, 16);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + 13, y, 2, 16);
}

// ---- Flagpole ----
function drawFlagpoleTop(ctx, x, y) {
    // Green ball on top
    ctx.fillStyle = '#43A047';
    ctx.fillRect(x + 5, y, 6, 6);
    ctx.fillStyle = '#80D050';
    ctx.fillRect(x + 5, y, 3, 3);
    ctx.fillStyle = '#1B6020';
    ctx.fillRect(x + 9, y + 3, 2, 3);
}

function drawFlagpolePole(ctx, x, y) {
    ctx.fillStyle = '#BCBCBC';
    ctx.fillRect(x + 7, y, 2, 16);
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x + 7, y, 1, 16);
}

function drawFlag(ctx, x, y) {
    // Triangular flag (green/white)
    ctx.fillStyle = '#43A047';
    // Flag pointing left (triangle)
    ctx.fillRect(x, y, 8, 1);
    ctx.fillRect(x + 1, y + 1, 8, 1);
    ctx.fillRect(x + 2, y + 2, 8, 1);
    ctx.fillRect(x + 3, y + 3, 8, 1);
    ctx.fillRect(x + 2, y + 4, 8, 1);
    ctx.fillRect(x + 1, y + 5, 8, 1);
    ctx.fillRect(x, y + 6, 8, 1);
    // Ball detail
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 5, y + 3, 1, 1);
}

// ---- Castle ----
function drawCastle(ctx, x, y, w, h) {
    const brick = '#BCBCBC';
    const brickDark = '#7C7C7C';
    const brickLight = '#FCFCFC';
    const black = '#000000';

    ctx.fillStyle = brick;
    ctx.fillRect(x, y, w, h);

    // Battlements (top)
    const bw = 8;
    ctx.fillStyle = '#5C94FC'; // background (cut out)
    for (let i = 0; i < w; i += bw * 2) {
        ctx.fillRect(x + i + bw, y, bw, 8);
    }

    // Door
    const doorW = 24;
    const doorH = 32;
    const doorX = x + (w - doorW) / 2;
    const doorY = y + h - doorH;
    ctx.fillStyle = black;
    // Arch shape
    ctx.fillRect(doorX, doorY + 8, doorW, doorH - 8);
    ctx.fillRect(doorX + 4, doorY + 4, doorW - 8, 4);
    ctx.fillRect(doorX + 8, doorY + 2, doorW - 16, 2);
    ctx.fillRect(doorX + 12, doorY, doorW - 24, 2);

    // Windows
    ctx.fillStyle = black;
    ctx.fillRect(x + w / 2 - 4, y + 20, 8, 8);
    // Tower windows
    ctx.fillRect(x + 12, y + 24, 8, 8);
    ctx.fillRect(x + w - 20, y + 24, 8, 8);

    // Brick texture lines
    ctx.fillStyle = brickDark;
    for (let yy = 0; yy < h; yy += 8) {
        ctx.fillRect(x, y + yy, w, 1);
    }
    for (let yy = 0; yy < h; yy += 8) {
        const offset = (yy / 8) % 2 === 0 ? 0 : 8;
        for (let xx = offset; xx < w; xx += 16) {
            ctx.fillRect(x + xx, y + yy, 1, 8);
        }
    }
}

// ---- Cloud ----
function drawCloud(ctx, x, y, size) {
    const w = '#FCFCFC';
    const b = '#5C94FC'; // background blue for outline effect
    // Small cloud (1 bush) or large (3 bushes)
    const bumps = size === 'small' ? 1 : 3;
    const cw = 16 * bumps;

    for (let i = 0; i < bumps; i++) {
        const bx = x + i * 16;
        // Cloud bump shape
        ctx.fillStyle = w;
        // Bottom rectangle
        ctx.fillRect(bx, y + 8, 16, 8);
        // Bumps on top
        ctx.fillRect(bx + 2, y + 4, 12, 4);
        ctx.fillRect(bx + 4, y + 2, 8, 2);
        ctx.fillRect(bx + 6, y, 4, 2);
        // Highlight
        ctx.fillStyle = '#D8D8D8';
        ctx.fillRect(bx + 2, y + 12, 12, 2);
        // Outline bottom
        ctx.fillStyle = b;
        ctx.fillRect(bx, y + 15, 16, 1);
    }
    if (bumps > 1) {
        // Connect bumps
        ctx.fillStyle = w;
        ctx.fillRect(x + 12, y + 8, 16 * (bumps - 1) - 0, 8);
        ctx.fillRect(x + 14, y + 6, 16 * (bumps - 1) - 4, 2);
    }
}

// ---- Bush ----
function drawBush(ctx, x, y, size) {
    const g = '#00A800';
    const gDark = '#006800';
    const gLight = '#80F880';
    const bumps = size === 'small' ? 1 : size === 'medium' ? 2 : 3;

    for (let i = 0; i < bumps; i++) {
        const bx = x + i * 16;
        ctx.fillStyle = g;
        ctx.fillRect(bx, y + 4, 16, 12);
        ctx.fillRect(bx + 2, y + 2, 12, 2);
        ctx.fillRect(bx + 4, y, 8, 2);
        // Highlights
        ctx.fillStyle = gLight;
        ctx.fillRect(bx + 4, y + 1, 4, 1);
        ctx.fillRect(bx + 2, y + 3, 2, 1);
        // Dark bottom
        ctx.fillStyle = gDark;
        ctx.fillRect(bx, y + 15, 16, 1);
    }
    if (bumps > 1) {
        ctx.fillStyle = g;
        ctx.fillRect(x + 12, y + 4, 16 * (bumps - 1), 12);
        ctx.fillRect(x + 14, y + 2, 16 * (bumps - 1) - 4, 2);
    }
}

// ---- Hill ----
function drawHill(ctx, x, y, size) {
    const g = '#00A800';
    const gDark = '#006800';
    const gLight = '#80F880';
    const w = size === 'small' ? 48 : 80;
    const h = size === 'small' ? 24 : 40;

    // Draw hill as a triangle-ish shape using rows
    for (let row = 0; row < h; row++) {
        const width = Math.floor((row + 1) / h * w);
        const startX = x + (w - width) / 2;
        ctx.fillStyle = g;
        ctx.fillRect(startX, y + h - row - 1, width, 1);
    }
    // Dark outline at base
    ctx.fillStyle = gDark;
    ctx.fillRect(x, y + h - 1, w, 1);
    // Highlights
    if (size === 'small') {
        ctx.fillStyle = gLight;
        ctx.fillRect(x + w / 2 - 2, y + h - 8, 2, 1);
        ctx.fillRect(x + w / 2 - 1, y + h - 12, 2, 1);
    } else {
        ctx.fillStyle = gLight;
        ctx.fillRect(x + w / 2 - 3, y + h - 16, 4, 1);
        ctx.fillRect(x + w / 2 - 2, y + h - 24, 3, 1);
    }
}

// ============================================================
// Utility functions
// ============================================================

function adjustBrightness(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, Math.floor(r * factor));
    const ng = Math.min(255, Math.floor(g * factor));
    const nb = Math.min(255, Math.floor(b * factor));
    return `rgb(${nr},${ng},${nb})`;
}

// Parse a sprite string array into a 2D color array (cached)
const spriteCache = {};

function parseSprite(spriteData) {
    if (spriteCache[spriteData]) return spriteCache[spriteData];
    const pixels = [];
    for (let row = 0; row < spriteData.length; row++) {
        const line = spriteData[row];
        const rowData = [];
        for (let col = 0; col < line.length; col++) {
            const ch = line[col];
            rowData.push(COLOR_MAP[ch] || null);
        }
        pixels.push(rowData);
    }
    spriteCache[spriteData] = pixels;
    return pixels;
}

// Draw a sprite from pixel data onto canvas
function drawSprite(ctx, spriteData, x, y, flipX) {
    const pixels = parseSprite(spriteData);
    const h = pixels.length;
    const w = pixels[0].length;

    if (flipX) {
        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const color = pixels[row][w - 1 - col];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    } else {
        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const color = pixels[row][col];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }
}

// Draw a sprite scaled
function drawSpriteScaled(ctx, spriteData, x, y, scale, flipX) {
    const pixels = parseSprite(spriteData);
    const h = pixels.length;
    const w = pixels[0].length;

    for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
            const color = flipX ? pixels[row][w - 1 - col] : pixels[row][col];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
            }
        }
    }
}
