// ============================================================
// Input System - Keyboard controls
// ============================================================

class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.justReleased = {};
        this.blocked = false;

        // Action mapping
        this.actions = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            run: false,
            pause: false,
            mute: false,
            enter: false,
        };

        this._setupListeners();
    }

    _setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.blocked) return;

            const code = e.code;
            const key = e.key.toLowerCase();

            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                 'Space', 'KeyZ', 'KeyX', 'KeyM', 'KeyP', 'Enter',
                 'ShiftLeft', 'ShiftRight'].includes(code)) {
                e.preventDefault();
            }

            if (!this.keys[code]) {
                this.justPressed[code] = true;
            }
            this.keys[code] = true;

            // Map to actions
            if (code === 'ArrowLeft' || key === 'a') this.actions.left = true;
            if (code === 'ArrowRight' || key === 'd') this.actions.right = true;
            if (code === 'ArrowUp' || key === 'w') this.actions.up = true;
            if (code === 'ArrowDown' || key === 's') this.actions.down = true;
            if (code === 'Space' || code === 'KeyX' || key === 'x') this.actions.jump = true;
            if (code === 'KeyZ' || code === 'ShiftLeft' || code === 'ShiftRight' || key === 'z') this.actions.run = true;
            if (code === 'KeyP') this.actions.pause = true;
            if (code === 'KeyM') this.actions.mute = true;
            if (code === 'Enter') this.actions.enter = true;
        });

        document.addEventListener('keyup', (e) => {
            const code = e.code;
            const key = e.key.toLowerCase();

            this.justReleased[code] = true;
            this.keys[code] = false;

            if (code === 'ArrowLeft' || key === 'a') this.actions.left = false;
            if (code === 'ArrowRight' || key === 'd') this.actions.right = false;
            if (code === 'ArrowUp' || key === 'w') this.actions.up = false;
            if (code === 'ArrowDown' || key === 's') this.actions.down = false;
            if (code === 'Space' || code === 'KeyX' || key === 'x') this.actions.jump = false;
            if (code === 'KeyZ' || code === 'ShiftLeft' || code === 'ShiftRight' || key === 'z') this.actions.run = false;
            if (code === 'KeyP') this.actions.pause = false;
            if (code === 'KeyM') this.actions.mute = false;
            if (code === 'Enter') this.actions.enter = false;
        });
    }

    isPressed(code) {
        return !!this.keys[code];
    }

    wasPressed(code) {
        return !!this.justPressed[code];
    }

    wasReleased(code) {
        return !!this.justReleased[code];
    }

    isActionDown(action) {
        return this.actions[action];
    }

    wasActionPressed(action) {
        // Check if any key mapped to this action was just pressed
        const keyMaps = {
            left: ['ArrowLeft'],
            right: ['ArrowRight'],
            up: ['ArrowUp'],
            down: ['ArrowDown'],
            jump: ['Space', 'KeyX'],
            run: ['KeyZ', 'ShiftLeft', 'ShiftRight'],
            pause: ['KeyP'],
            mute: ['KeyM'],
            enter: ['Enter'],
        };
        const codes = keyMaps[action] || [];
        for (const c of codes) {
            if (this.justPressed[c]) return true;
        }
        return false;
    }

    clearFrame() {
        this.justPressed = {};
        this.justReleased = {};
    }

    block() {
        this.blocked = true;
        this.keys = {};
        this.actions = {
            left: false, right: false, up: false, down: false,
            jump: false, run: false, pause: false, mute: false, enter: false,
        };
    }

    unblock() {
        this.blocked = false;
    }
}

const input = new InputManager();
