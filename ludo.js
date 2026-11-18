/**
 * ludo.js — JavaScript port of ludo.cpp (mirrors the C++ OOP structure)
 * This file is auto-generated to replicate the C++ game logic so the game
 * can run in-browser without compiling. The authoritative source is ludo.cpp.
 *
 * OOP Structure (mirrors C++):
 *   class Player (abstract base)  → subclasses: Red, Green, Yellow, Blue
 */

// Note: Module is pre-defined in index.html as:
//   var Module = { onRuntimeInitialized: init };
// This file merges its methods into that object.

// ── Path arrays (mirror int pr[52], pc[52]) ──────────────────────────────────
const pr = new Array(52);
const pc = new Array(52);

const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];

function buildPath() {
    const m = "RRRRaUUUUURRDDDDDbRRRRRDDLLLLLcDDDDDLLUUUUUdLLLLLUU";
    let r = 6, c = 1;
    pr[0] = r; pc[0] = c;
    for (let i = 0; i < 51; i++) {
        const ch = m[i];
        if (ch === 'R') c++;
        else if (ch === 'L') c--;
        else if (ch === 'U') r--;
        else if (ch === 'D') r++;
        else if (ch === 'a') { r--; c++; }
        else if (ch === 'b') { r++; c++; }
        else if (ch === 'c') { r++; c--; }
        else { r--; c--; }
        pr[i + 1] = r;
        pc[i + 1] = c;
    }
}

function isSafe(cell) {
    return safeCells.includes(cell);
}

// ── class Player (abstract base) ─────────────────────────────────────────────
class Player {
    constructor() {
        this.start = 0;
        this.baseR = 0; this.baseC = 0;
        this.homeR = 0; this.homeC = 0;
        this.stepR = 0; this.stepC = 0;
        this.pos = [-1, -1, -1, -1];
    }

    colour() { return ""; } // abstract — overridden in subclasses

    reset() { this.pos = [-1, -1, -1, -1]; }

    trackCell(t) { return (this.start + this.pos[t]) % 52; }

    onTrack(t) { return this.pos[t] >= 0 && this.pos[t] <= 50; }

    canMove(t, dice) {
        if (this.pos[t] === -1) return dice === 6;
        return this.pos[t] + dice <= 56;
    }

    hasMove(dice) {
        for (let t = 0; t < 4; t++)
            if (this.canMove(t, dice)) return true;
        return false;
    }

    row(t) {
        if (this.pos[t] === -1) return this.baseR + Math.floor(t / 2);
        if (this.pos[t] <= 50) return pr[this.trackCell(t)];
        return this.homeR + this.stepR * (this.pos[t] - 51);
    }

    col(t) {
        if (this.pos[t] === -1) return this.baseC + (t % 2);
        if (this.pos[t] <= 50) return pc[this.trackCell(t)];
        return this.homeC + this.stepC * (this.pos[t] - 51);
    }

    finished() {
        return this.pos.every(p => p === 56);
    }
}

// ── Concrete subclasses (mirror C++) ─────────────────────────────────────────
class Red extends Player {
    constructor() {
        super();
        this.start = 0; this.baseR = 2; this.baseC = 2;
        this.homeR = 7; this.homeC = 1; this.stepR = 0; this.stepC = 1;
    }
    colour() { return "Red"; }
}

class Green extends Player {
    constructor() {
        super();
        this.start = 13; this.baseR = 2; this.baseC = 11;
        this.homeR = 1; this.homeC = 7; this.stepR = 1; this.stepC = 0;
    }
    colour() { return "Green"; }
}

class Yellow extends Player {
    constructor() {
        super();
        this.start = 26; this.baseR = 11; this.baseC = 11;
        this.homeR = 7; this.homeC = 13; this.stepR = 0; this.stepC = -1;
    }
    colour() { return "Yellow"; }
}

class Blue extends Player {
    constructor() {
        super();
        this.start = 39; this.baseR = 11; this.baseC = 2;
        this.homeR = 13; this.homeC = 7; this.stepR = -1; this.stepC = 0;
    }
    colour() { return "Blue"; }
}

// ── Game state (mirrors global C++ vars) ─────────────────────────────────────
const red    = new Red();
const green  = new Green();
const yellow = new Yellow();
const blue   = new Blue();
const players = [red, green, yellow, blue];

let seats = [0, 1, 2, 3];
let n = 4, turn = 0, dice = 0, sixes = 0, winner = -1;
let waiting = false;
let msg = "";

function cur() { return players[seats[turn]]; }

function nextTurn() {
    turn = (turn + 1) % n;
    sixes = 0;
    waiting = false;
}

// ── Exported C-style API (mirrors extern "C" block) ──────────────────────────
// Merge all game methods into the pre-existing Module object (defined in index.html)
Object.assign(Module, {
    newGame(count) {
        buildPath();
        n = count;
        for (let i = 0; i < n; i++) seats[i] = (n === 2) ? i * 2 : i;
        for (let i = 0; i < 4; i++) players[i].reset();
        turn = 0; dice = 0; sixes = 0; winner = -1; waiting = false;
        msg = cur().colour() + " rolls the dice";
    },

    rollDice() {
        if (waiting || winner >= 0) return dice;
        dice = Math.floor(Math.random() * 6) + 1;
        const who = cur().colour();
        if (dice === 6) sixes++;
        else sixes = 0;
        if (sixes === 3) {
            msg = who + " rolled three sixes, turn lost";
            nextTurn();
        } else if (!cur().hasMove(dice)) {
            msg = who + " rolled " + dice + " and has no move";
            nextTurn();
        } else {
            waiting = true;
            msg = who + " rolled " + dice + ", pick a token";
        }
        return dice;
    },

    advanceTokenStep(t) {
        const p = cur();
        if (p.pos[t] === -1) p.pos[t] = 0;
        else p.pos[t] += 1;
    },

    finalizeTokenMove(t) {
        const p = cur();
        if (!waiting || winner >= 0 || t < 0 || t > 3) return;
        let bonus = (dice === 6);
        msg = p.colour() + " moved";
        if (p.onTrack(t) && !isSafe(p.trackCell(t))) {
            for (let i = 0; i < n; i++) {
                const o = players[seats[i]];
                if (o === p) continue;
                for (let k = 0; k < 4; k++) {
                    if (o.onTrack(k) && o.trackCell(k) === p.trackCell(t)) {
                        o.pos[k] = -1;
                        bonus = true;
                        msg = p.colour() + " captured a " + o.colour() + " token!";
                    }
                }
            }
        }
        if (p.pos[t] === 56) {
            bonus = true;
            msg = p.colour() + " got a token home 🏠";
        }
        waiting = false;
        if (p.finished()) {
            winner = seats[turn];
            msg = "🎉 " + p.colour() + " wins the game!";
            return;
        }
        if (bonus) msg += " — roll again!";
        else nextTurn();
    },

    moveToken(t) {
        const p = cur();
        if (!waiting || winner >= 0 || t < 0 || t > 3 || !p.canMove(t, dice)) return;
        if (p.pos[t] === -1) p.pos[t] = 0;
        else p.pos[t] += dice;
        this.finalizeTokenMove(t);
    },

    tokenRow(p, t)     { return players[p].row(t); },
    tokenCol(p, t)     { return players[p].col(t); },
    tokenPos(p, t)     { return players[p].pos[t]; },
    isActive(p)        { return seats.slice(0, n).includes(p) ? 1 : 0; },
    currentPlayer()    { return seats[turn]; },
    getDice()          { return dice; },
    getWinner()        { return winner; },
    canMoveToken(t)    { return (waiting && winner < 0 && cur().canMove(t, dice)) ? 1 : 0; },
    getMessage()       { return msg; },

    // cwrap shim so index.html's init() works unchanged
    cwrap(name, retType, argTypes) {
        return (...args) => Module[name](...args);
    }
});

// Kick off: fire onRuntimeInitialized when DOM is ready.
// index.html defines  var Module = { onRuntimeInitialized: init }  before this script,
// so Module already exists; we just need to call its callback.
(function bootstrap() {
    function fire() {
        if (typeof Module.onRuntimeInitialized === "function") {
            Module.onRuntimeInitialized();
        }
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fire);
    } else {
        fire();
    }
})();
