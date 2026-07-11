// ============================================================
// Entity System - Player, Enemies, Items
// ============================================================

// Base entity
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.onGround = false;
        this.facing = DIR_RIGHT;
        this.type = 'entity';
    }

    get left() { return this.x; }
    get right() { return this.x + this.w; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }

    // AABB collision check
    collidesWith(other) {
        return this.left < other.right &&
               this.right > other.left &&
               this.top < other.bottom &&
               this.bottom > other.top;
    }

    update(game) {}
    draw(ctx, camera) {}
}

// ============================================================
// Player (Mario)
// ============================================================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.type = 'player';
        this.powerState = 'small'; // small, super
        this.state = 'normal';     // normal, dying, dead, flagpole, complete, spawning
        this.animFrame = 0;
        this.animTimer = 0;
        this.walkFrame = 0;
        this.jumpHeld = false;
        this.jumpHoldFrames = 0;
        this.canJump = false;
        this.invincible = 0;       // invincibility frames after taking damage
        this.crouching = false;
        this.fireballCooldown = 0;
        this.flagSlideSpeed = 0;
        this.deathTimer = 0;
        this.spawnTimer = 0;
        this.enterPipeTimer = 0;
        this.skidding = false;
        this.wasOnGround = false;
    }

    setSuper() {
        if (this.powerState === 'small') {
            this.powerState = 'super';
            this.h = 32;
            this.y -= 16; // grow upward
        }
    }

    setSmall() {
        if (this.powerState === 'super') {
            this.powerState = 'small';
            this.h = 16;
            this.y += 16;
        }
    }

    takeDamage(game) {
        if (this.invincible > 0) return;
        if (this.powerState === 'super') {
            this.setSmall();
            this.invincible = 120; // 2 seconds at 60fps
            audio.sfxPowerDown();
        } else {
            this.die(game);
        }
    }

    die(game) {
        if (this.state !== 'normal') return;
        this.state = 'dying';
        this.vy = -8;
        this.vx = 0;
        this.dead = false;
        this.deathTimer = 0;
        audio.sfxDeath();
        game.onPlayerDeath();
    }

    update(game) {
        if (this.state === 'dying') {
            this.deathTimer++;
            this.vy += GRAVITY * 0.5;
            this.y += this.vy;
            if (this.deathTimer > 120) {
                this.state = 'dead';
                game.onPlayerDeathComplete();
            }
            return;
        }

        if (this.state === 'flagpole') {
            this.updateFlagpole(game);
            return;
        }

        if (this.state === 'complete') {
            this.updateComplete(game);
            return;
        }

        if (this.state === 'spawning') {
            this.spawnTimer++;
            if (this.spawnTimer > 30) {
                this.state = 'normal';
            }
            return;
        }

        if (this.invincible > 0) this.invincible--;
        if (this.fireballCooldown > 0) this.fireballCooldown--;

        // Input
        const left = input.isActionDown('left');
        const right = input.isActionDown('right');
        const down = input.isActionDown('down');
        const jumpPressed = input.wasActionPressed('jump');
        const jumpHeld = input.isActionDown('jump');
        const runHeld = input.isActionDown('run');

        // Crouching (only when super and on ground)
        this.crouching = (this.powerState === 'super' && down && this.onGround);

        // Horizontal movement
        if (!this.crouching) {
            const accel = runHeld ? RUN_ACCEL : WALK_ACCEL;
            const maxSpeed = runHeld ? RUN_MAX : WALK_MAX;

            if (left && !right) {
                this.vx -= accel;
                if (this.vx < -maxSpeed) this.vx = -maxSpeed;
                this.facing = DIR_LEFT;
                this.skidding = (this.vx > 0);
            } else if (right && !left) {
                this.vx += accel;
                if (this.vx > maxSpeed) this.vx = maxSpeed;
                this.facing = DIR_RIGHT;
                this.skidding = (this.vx < 0);
            } else {
                // Friction
                if (this.onGround) {
                    if (this.vx > 0) {
                        this.vx -= FRICTION;
                        if (this.vx < 0) this.vx = 0;
                    } else if (this.vx < 0) {
                        this.vx += FRICTION;
                        if (this.vx > 0) this.vx = 0;
                    }
                }
                this.skidding = false;
            }
        } else {
            // Crouching: stop horizontal movement
            if (this.vx > 0) {
                this.vx -= FRICTION * 2;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += FRICTION * 2;
                if (this.vx > 0) this.vx = 0;
            }
        }

        // Jumping
        if (jumpPressed && this.onGround && !this.crouching) {
            const speed = Math.abs(this.vx);
            this.vy = speed > WALK_MAX ? JUMP_VEL_RUN : JUMP_VEL;
            this.onGround = false;
            this.jumpHoldFrames = 0;
            this.jumpHeld = true;
            if (this.powerState === 'super') {
                audio.sfxJumpSuper();
            } else {
                audio.sfxJump();
            }
        }

        // Variable jump height
        if (this.jumpHeld && jumpHeld && this.vy < 0) {
            this.vy += JUMP_HOLD_GRAVITY;
            this.jumpHoldFrames++;
            if (this.jumpHoldFrames > MAX_JUMP_HOLD) {
                this.jumpHeld = false;
            }
        } else {
            this.jumpHeld = false;
            this.vy += GRAVITY;
        }

        if (this.vy > MAX_FALL) this.vy = MAX_FALL;

        // Fireball shooting
        if (input.wasActionPressed('run') && this.powerState === 'super' && this.fireballCooldown === 0) {
            // Skip fireball for now - only mushroom power-up
        }

        // Move and collide
        this.wasOnGround = this.onGround;
        this.moveX(game);
        this.moveY(game);

        // Animation
        this.animTimer++;
        if (Math.abs(this.vx) > 0.1) {
            const speed = Math.abs(this.vx);
            const interval = Math.max(2, Math.floor(8 - speed));
            if (this.animTimer >= interval) {
                this.animTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 3;
            }
        } else {
            this.walkFrame = 0;
        }

        // Check entity collisions
        this.checkEntityCollisions(game);

        // Check pit (fell off the bottom)
        if (this.y > game.level.height * TILE_SIZE + 32) {
            this.die(game);
        }

        // Check flagpole
        this.checkFlagpole(game);
    }

    moveX(game) {
        this.x += this.vx;
        const level = game.level;

        // Check tile collisions
        const minRow = Math.floor(this.y / TILE_SIZE);
        const maxRow = Math.floor((this.y + this.h - 1) / TILE_SIZE);

        if (this.vx > 0) {
            const col = Math.floor((this.x + this.w - 1) / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = col * TILE_SIZE - this.w;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const col = Math.floor(this.x / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = (col + 1) * TILE_SIZE;
                    this.vx = 0;
                    break;
                }
            }
        }

        // Clamp to level bounds
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.w > level.width * TILE_SIZE) {
            this.x = level.width * TILE_SIZE - this.w;
            this.vx = 0;
        }
    }

    moveY(game) {
        this.y += this.vy;
        const level = game.level;
        this.onGround = false;

        const minCol = Math.floor(this.x / TILE_SIZE);
        const maxCol = Math.floor((this.x + this.w - 1) / TILE_SIZE);

        if (this.vy > 0) {
            // Falling
            const row = Math.floor((this.y + this.h - 1) / TILE_SIZE);
            for (let col = minCol; col <= maxCol; col++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.y = row * TILE_SIZE - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        } else if (this.vy < 0) {
            // Rising (jumping)
            const row = Math.floor(this.y / TILE_SIZE);
            for (let col = minCol; col <= maxCol; col++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.y = (row + 1) * TILE_SIZE;
                    this.vy = 0;
                    // Bump the block!
                    this.bumpBlock(game, col, row);
                    break;
                }
            }
        }
    }

    bumpBlock(game, col, row) {
        const tile = game.level[row][col];
        const tileX = col * TILE_SIZE;
        const tileY = row * TILE_SIZE;

        if (tile === TILE.QUESTION_COIN || tile === TILE.QUESTION_MUSHROOM ||
            tile === TILE.QUESTION_1UP || tile === TILE.QUESTION_MULTI) {
            // Spawn item based on type
            if (tile === TILE.QUESTION_COIN) {
                // Spawn coin pop
                game.spawnCoinPop(col, row);
                game.addScore(200);
                game.addCoin();
                audio.sfxCoin();
            } else if (tile === TILE.QUESTION_MUSHROOM) {
                if (this.powerState === 'small') {
                    game.spawnMushroom(col, row);
                } else {
                    game.spawnCoinPop(col, row);
                    game.addScore(200);
                    game.addCoin();
                }
                audio.sfxPowerUpAppears();
            } else if (tile === TILE.QUESTION_1UP) {
                game.spawn1UpMushroom(col, row);
                audio.sfxPowerUpAppears();
            } else if (tile === TILE.QUESTION_MULTI) {
                game.spawnCoinPop(col, row);
                game.addScore(200);
                game.addCoin();
                audio.sfxCoin();
                // Multi-coin: don't deplete immediately (could add counter)
            }
            game.level[row][col] = TILE.USED;
            game.bumpAnimation(col, row);
        } else if (tile === TILE.BRICK) {
            if (this.powerState === 'super') {
                // Break the brick
                game.level[row][col] = TILE.EMPTY;
                game.spawnBrickPieces(col, row);
                game.addScore(50);
                audio.sfxBrickBreak();
            } else {
                // Just bump
                game.bumpAnimation(col, row);
                audio.sfxBump();
            }
        } else {
            audio.sfxBump();
        }
    }

    checkEntityCollisions(game) {
        for (const entity of game.entities) {
            if (entity === this || entity.dead) continue;

            if (!this.collidesWith(entity)) continue;

            switch (entity.type) {
                case 'goomba':
                    this.handleEnemyCollision(game, entity);
                    break;
                case 'koopa':
                    this.handleKoopaCollision(game, entity);
                    break;
                case 'mushroom':
                    entity.collect(game);
                    this.setSuper();
                    game.addScore(1000);
                    audio.sfxPowerUp();
                    break;
                case '1up':
                    entity.collect(game);
                    game.addLife();
                    audio.sfxOneUp();
                    break;
                case 'coin':
                    entity.collect(game);
                    game.addScore(200);
                    game.addCoin();
                    audio.sfxCoin();
                    break;
                case 'coinpop':
                    entity.collect(game);
                    game.addScore(200);
                    game.addCoin();
                    audio.sfxCoin();
                    break;
                case 'shell':
                    this.handleShellCollision(game, entity);
                    break;
            }
        }
    }

    handleEnemyCollision(game, enemy) {
        // Check if stomping (falling and feet above enemy center)
        if (this.vy > 0 && this.bottom - this.vy <= enemy.top + 4) {
            // Stomp!
            enemy.stomp(game);
            this.vy = JUMP_VEL * 0.6;
            if (input.isActionDown('jump')) {
                this.vy = JUMP_VEL * 0.8;
            }
            game.addScore(100);
            audio.sfxStomp();
        } else {
            // Take damage
            this.takeDamage(game);
        }
    }

    handleKoopaCollision(game, koopa) {
        if (koopa.state === 'shell' && !koopa.shellMoving) {
            // Kick the shell
            const kickDir = this.x < koopa.x ? DIR_RIGHT : DIR_LEFT;
            koopa.kick(kickDir, game);
            this.vy = JUMP_VEL * 0.4;
            game.addScore(400);
            audio.sfxKick();
        } else if (koopa.state === 'shell' && koopa.shellMoving) {
            // Stop the shell if we land on it, or take damage
            if (this.vy > 0 && this.bottom - this.vy <= koopa.top + 4) {
                koopa.shellMoving = false;
                koopa.vx = 0;
                this.vy = JUMP_VEL * 0.6;
                game.addScore(100);
                audio.sfxStomp();
            } else {
                this.takeDamage(game);
            }
        } else if (koopa.state === 'normal') {
            // Regular stomp or damage
            if (this.vy > 0 && this.bottom - this.vy <= koopa.top + 4) {
                koopa.stomp(game);
                this.vy = JUMP_VEL * 0.6;
                game.addScore(100);
                audio.sfxStomp();
            } else {
                this.takeDamage(game);
            }
        }
    }

    handleShellCollision(game, shell) {
        if (!shell.shellMoving) {
            // Kick it
            const kickDir = this.x < shell.x ? DIR_RIGHT : DIR_LEFT;
            shell.kick(kickDir, game);
            this.vy = JUMP_VEL * 0.4;
            audio.sfxKick();
        } else {
            if (this.vy > 0 && this.bottom - this.vy <= shell.top + 4) {
                shell.shellMoving = false;
                shell.vx = 0;
                this.vy = JUMP_VEL * 0.6;
                game.addScore(100);
                audio.sfxStomp();
            } else {
                this.takeDamage(game);
            }
        }
    }

    checkFlagpole(game) {
        const flagCol = game.levelData.flagCol;
        const flagX = flagCol * TILE_SIZE;
        // Check if player overlaps with the pole area (center of tile)
        if (this.x + this.w > flagX + 4 && this.x < flagX + 12 && this.state === 'normal') {
            // Hit flagpole
            this.state = 'flagpole';
            this.vx = 0;
            this.x = flagX - this.w + 10;
            this.vy = 2;
            this.flagSlideSpeed = 2;
            audio.sfxFlagpole();
            game.onFlagpoleHit(this);
        }
    }

    updateFlagpole(game) {
        // Slide down the flagpole
        this.y += this.flagSlideSpeed;
        const groundY = game.levelData.groundY * TILE_SIZE - this.h;
        if (this.y >= groundY) {
            this.y = groundY;
            this.state = 'complete';
            this.facing = DIR_RIGHT;
            this.completeTimer = 0;
            this.vx = 1.5;
        }
    }

    updateComplete(game) {
        // Walk toward castle
        this.x += this.vx;
        this.animTimer++;
        if (this.animTimer >= 6) {
            this.animTimer = 0;
            this.walkFrame = (this.walkFrame + 1) % 3;
        }
        const castleX = (game.levelData.castleCol + 2) * TILE_SIZE;
        if (this.x > castleX) {
            game.onLevelComplete();
        }
    }

    draw(ctx, camera) {
        if (this.state === 'spawning') return;

        // Flicker when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
            return;
        }

        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        const flip = this.facing === DIR_LEFT;

        let sprite;

        if (this.state === 'dying') {
            sprite = SPR_MARIO_SMALL_DEAD;
            drawSprite(ctx, sprite, drawX, drawY);
            return;
        }

        if (this.crouching && this.powerState === 'super') {
            sprite = SPR_MARIO_SUPER_CROUCH;
            drawSprite(ctx, sprite, drawX, drawY, flip);
            return;
        }

        if (!this.onGround && this.state === 'normal') {
            // Jumping
            sprite = this.powerState === 'super' ? SPR_MARIO_SUPER_JUMP : SPR_MARIO_SMALL_JUMP;
        } else if (Math.abs(this.vx) > 0.1) {
            // Walking
            if (this.powerState === 'super') {
                sprite = [SPR_MARIO_SUPER_STAND, SPR_MARIO_SUPER_WALK1, SPR_MARIO_SUPER_WALK2][this.walkFrame];
            } else {
                sprite = [SPR_MARIO_SMALL_STAND, SPR_MARIO_SMALL_WALK1, SPR_MARIO_SMALL_WALK2][this.walkFrame];
            }
        } else {
            // Standing
            sprite = this.powerState === 'super' ? SPR_MARIO_SUPER_STAND : SPR_MARIO_SMALL_STAND;
        }

        drawSprite(ctx, sprite, drawX, drawY, flip);
    }
}

// ============================================================
// Goomba
// ============================================================
class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.type = 'goomba';
        this.vx = -0.8;
        this.vy = 0;
        this.animTimer = 0;
        this.animFrame = 0;
        this.squished = false;
        this.squishTimer = 0;
    }

    stomp(game) {
        this.squished = true;
        this.squishTimer = 0;
        this.vx = 0;
        this.vy = 0;
        game.spawnScorePopup(this.x, this.y, '100');
    }

    update(game) {
        if (this.squished) {
            this.squishTimer++;
            if (this.squishTimer > 30) {
                this.dead = true;
            }
            return;
        }

        if (this.dead) return;

        // Gravity
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL) this.vy = MAX_FALL;

        // Move X
        this.x += this.vx;
        const level = game.level;
        const minRow = Math.floor(this.y / TILE_SIZE);
        const maxRow = Math.floor((this.y + this.h - 1) / TILE_SIZE);

        if (this.vx > 0) {
            const col = Math.floor((this.x + this.w - 1) / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = col * TILE_SIZE - this.w;
                    this.vx = -this.vx;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const col = Math.floor(this.x / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = (col + 1) * TILE_SIZE;
                    this.vx = -this.vx;
                    break;
                }
            }
        }

        // Move Y
        this.y += this.vy;
        const minCol = Math.floor(this.x / TILE_SIZE);
        const maxCol = Math.floor((this.x + this.w - 1) / TILE_SIZE);
        this.onGround = false;

        if (this.vy > 0) {
            const row = Math.floor((this.y + this.h - 1) / TILE_SIZE);
            for (let col = minCol; col <= maxCol; col++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.y = row * TILE_SIZE - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }

        // Check edge (turn around at ledges)
        if (this.onGround) {
            const checkCol = this.vx > 0 ?
                Math.floor((this.x + this.w + 2) / TILE_SIZE) :
                Math.floor((this.x - 2) / TILE_SIZE);
            const checkRow = Math.floor((this.y + this.h + 2) / TILE_SIZE);
            if (level[checkRow] && !game.isSolidTile(level[checkRow][checkCol])) {
                // About to walk off ledge - goombas don't turn around in original
                // (they just walk off) - so leave this commented
                // this.vx = -this.vx;
            }
        }

        // Animation
        this.animTimer++;
        if (this.animTimer >= 12) {
            this.animTimer = 0;
            this.animFrame = 1 - this.animFrame;
        }

        // Pit death
        if (this.y > game.level.height * TILE_SIZE + 32) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);

        if (this.squished) {
            drawSprite(ctx, SPR_GOOMBA_SQUISHED, drawX, drawY);
        } else {
            const sprite = this.animFrame === 0 ? SPR_GOOMBA1 : SPR_GOOMBA2;
            drawSprite(ctx, sprite, drawX, drawY);
        }
    }
}

// ============================================================
// Koopa Troopa
// ============================================================
class Koopa extends Entity {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.type = 'koopa';
        this.vx = -0.8;
        this.vy = 0;
        this.state = 'normal'; // normal, shell
        this.shellMoving = false;
        this.animTimer = 0;
        this.animFrame = 0;
        this.shellTimer = 0;
        this.spinFrame = 0;
    }

    stomp(game) {
        if (this.state === 'normal') {
            this.state = 'shell';
            this.h = 16;
            this.y += 8;
            this.vx = 0;
            this.shellMoving = false;
            this.shellTimer = 0;
            game.spawnScorePopup(this.x, this.y, '100');
        }
    }

    kick(dir, game) {
        this.shellMoving = true;
        this.vx = dir * 6;
        game.spawnScorePopup(this.x, this.y, '400');
    }

    update(game) {
        if (this.dead) return;

        if (this.state === 'shell' && !this.shellMoving) {
            this.shellTimer++;
            if (this.shellTimer > 300) {
                // Wake up
                this.state = 'normal';
                this.h = 24;
                this.y -= 8;
                this.vx = -0.8;
            }
        }

        // Gravity
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL) this.vy = MAX_FALL;

        // Move X
        this.x += this.vx;
        const level = game.level;
        const minRow = Math.floor(this.y / TILE_SIZE);
        const maxRow = Math.floor((this.y + this.h - 1) / TILE_SIZE);

        if (this.vx > 0) {
            const col = Math.floor((this.x + this.w - 1) / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = col * TILE_SIZE - this.w;
                    this.vx = -this.vx;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const col = Math.floor(this.x / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = (col + 1) * TILE_SIZE;
                    this.vx = -this.vx;
                    break;
                }
            }
        }

        // Move Y
        this.y += this.vy;
        const minCol = Math.floor(this.x / TILE_SIZE);
        const maxCol = Math.floor((this.x + this.w - 1) / TILE_SIZE);
        this.onGround = false;

        if (this.vy > 0) {
            const row = Math.floor((this.y + this.h - 1) / TILE_SIZE);
            for (let col = minCol; col <= maxCol; col++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.y = row * TILE_SIZE - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }

        // Shell collision with other enemies
        if (this.shellMoving) {
            this.spinFrame = (this.spinFrame + 1) % 4;
            for (const entity of game.entities) {
                if (entity === this || entity.dead) continue;
                if (entity.type === 'goomba' || entity.type === 'koopa') {
                    if (this.collidesWith(entity)) {
                        entity.dead = true;
                        entity.vy = -6;
                        entity.vx = this.vx > 0 ? 3 : -3;
                        game.addScore(200);
                        game.spawnScorePopup(entity.x, entity.y, '200');
                    }
                }
            }
        }

        // Animation
        if (this.state === 'normal') {
            this.animTimer++;
            if (this.animTimer >= 12) {
                this.animTimer = 0;
                this.animFrame = 1 - this.animFrame;
            }
        }

        // Pit death
        if (this.y > game.level.height * TILE_SIZE + 32) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);

        if (this.state === 'shell') {
            if (this.shellMoving) {
                drawSprite(ctx, SPR_KOOPA_SHELL_SPIN, drawX, drawY);
            } else {
                drawSprite(ctx, SPR_KOOPA_SHELL, drawX, drawY);
            }
        } else {
            const sprite = this.animFrame === 0 ? SPR_KOOPA_WALK1 : SPR_KOOPA_WALK2;
            const flip = this.vx > 0;
            drawSprite(ctx, sprite, drawX, drawY, flip);
        }
    }
}

// ============================================================
// Mushroom (power-up)
// ============================================================
class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.type = 'mushroom';
        this.vx = 1.5;
        this.vy = 0;
        this.emerging = true;
        this.emergeY = y - 16;
        this.spawnY = y;
    }

    collect(game) {
        this.dead = true;
    }

    update(game) {
        if (this.dead) return;

        if (this.emerging) {
            this.y -= 0.5;
            if (this.y <= this.spawnY - 16) {
                this.emerging = false;
                this.y = this.spawnY - 16;
            }
            return;
        }

        // Gravity
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL) this.vy = MAX_FALL;

        // Move X
        this.x += this.vx;
        const level = game.level;
        const minRow = Math.floor(this.y / TILE_SIZE);
        const maxRow = Math.floor((this.y + this.h - 1) / TILE_SIZE);

        if (this.vx > 0) {
            const col = Math.floor((this.x + this.w - 1) / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = col * TILE_SIZE - this.w;
                    this.vx = -this.vx;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const col = Math.floor(this.x / TILE_SIZE);
            for (let row = minRow; row <= maxRow; row++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.x = (col + 1) * TILE_SIZE;
                    this.vx = -this.vx;
                    break;
                }
            }
        }

        // Move Y
        this.y += this.vy;
        const minCol = Math.floor(this.x / TILE_SIZE);
        const maxCol = Math.floor((this.x + this.w - 1) / TILE_SIZE);
        this.onGround = false;

        if (this.vy > 0) {
            const row = Math.floor((this.y + this.h - 1) / TILE_SIZE);
            for (let col = minCol; col <= maxCol; col++) {
                if (level[row] && game.isSolidTile(level[row][col])) {
                    this.y = row * TILE_SIZE - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }

        if (this.y > game.level.height * TILE_SIZE + 32) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        drawSprite(ctx, SPR_MUSHROOM, drawX, drawY);
    }
}

// ============================================================
// 1-Up Mushroom
// ============================================================
class OneUpMushroom extends Mushroom {
    constructor(x, y) {
        super(x, y);
        this.type = '1up';
        this.vx = 1.5;
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        drawSprite(ctx, SPR_1UP_MUSHROOM, drawX, drawY);
    }
}

// ============================================================
// Coin (floating)
// ============================================================
class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.type = 'coin';
        this.animTimer = 0;
        this.animFrame = 0;
    }

    collect(game) {
        this.dead = true;
        game.spawnScorePopup(this.x, this.y, '200');
    }

    update(game) {
        this.animTimer++;
        if (this.animTimer >= 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        const sprites = [SPR_COIN1, SPR_COIN2, SPR_COIN3, SPR_COIN4];
        drawSprite(ctx, sprites[this.animFrame], drawX, drawY);
    }
}

// ============================================================
// Coin Pop (from question block)
// ============================================================
class CoinPop extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.type = 'coinpop';
        this.vy = -7;
        this.timer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.startY = y;
    }

    collect(game) {
        this.dead = true;
    }

    update(game) {
        this.timer++;
        this.y += this.vy;
        this.vy += 0.5;

        this.animTimer++;
        if (this.animTimer >= 4) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        if (this.timer > 20) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        const sprites = [SPR_COIN1, SPR_COIN2, SPR_COIN3, SPR_COIN4];
        drawSprite(ctx, sprites[this.animFrame], drawX, drawY);
    }
}

// ============================================================
// Score Popup
// ============================================================
class ScorePopup extends Entity {
    constructor(x, y, text) {
        super(x, y, 16, 8);
        this.type = 'scorepopup';
        this.text = text;
        this.timer = 0;
        this.vy = -1;
    }

    update(game) {
        this.timer++;
        this.y += this.vy;
        this.vy += 0.05;
        if (this.timer > 40) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        ctx.fillStyle = '#FCFCFC';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, drawX + 8, drawY + 6);
        ctx.textAlign = 'left';
    }
}

// ============================================================
// Brick Piece (when breaking bricks)
// ============================================================
class BrickPiece extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 8, 8);
        this.type = 'brickpiece';
        this.vx = vx;
        this.vy = vy;
        this.timer = 0;
    }

    update(game) {
        this.timer++;
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.timer > 90 || this.y > game.level.height * TILE_SIZE + 32) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        drawSprite(ctx, SPR_BRICK_PIECE, drawX, drawY);
    }
}

// ============================================================
// Bump Animation (block bumping)
// ============================================================
class BumpAnim {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.timer = 0;
        this.dead = false;
        this.offset = 0;
    }

    update() {
        this.timer++;
        if (this.timer < 8) {
            this.offset = -this.timer;
        } else if (this.timer < 16) {
            this.offset = -16 + this.timer;
        } else {
            this.offset = 0;
            this.dead = true;
        }
    }
}
