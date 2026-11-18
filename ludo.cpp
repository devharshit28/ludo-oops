#include <cstdlib>
#include <ctime>
#include <string>
using namespace std;

int pr[52], pc[52];
int safeCells[8] = {0, 8, 13, 21, 26, 34, 39, 47};

void buildPath() {
    string m = "RRRRaUUUUURRDDDDDbRRRRRDDLLLLLcDDDDDLLUUUUUdLLLLLUU";
    int r = 6, c = 1;
    pr[0] = r;
    pc[0] = c;
    for (int i = 0; i < 51; i++) {
        char ch = m[i];
        if (ch == 'R') c++;
        else if (ch == 'L') c--;
        else if (ch == 'U') r--;
        else if (ch == 'D') r++;
        else if (ch == 'a') { r--; c++; }
        else if (ch == 'b') { r++; c++; }
        else if (ch == 'c') { r++; c--; }
        else { r--; c--; }
        pr[i + 1] = r;
        pc[i + 1] = c;
    }
}

bool isSafe(int cell) {
    for (int i = 0; i < 8; i++)
        if (safeCells[i] == cell) return true;
    return false;
}
// the parent class 
class Player {
public:
    int start, baseR, baseC, homeR, homeC, stepR, stepC;
    int pos[4];

    Player() { reset(); }
    virtual ~Player() {}
    virtual string colour() = 0;

    void reset() {
        for (int i = 0; i < 4; i++) pos[i] = -1;
    }

    int trackCell(int t) { return (start + pos[t]) % 52; }

    bool onTrack(int t) { return pos[t] >= 0 && pos[t] <= 50; }

    bool canMove(int t, int dice) {
        if (pos[t] == -1) return dice == 6;
        return pos[t] + dice <= 56;
    }

    bool hasMove(int dice) {
        for (int t = 0; t < 4; t++)
            if (canMove(t, dice)) return true;
        return false;
    }

    int row(int t) {
        if (pos[t] == -1) return baseR + t / 2;
        if (pos[t] <= 50) return pr[trackCell(t)];
        return homeR + stepR * (pos[t] - 51);
    }

    int col(int t) {
        if (pos[t] == -1) return baseC + t % 2;
        if (pos[t] <= 50) return pc[trackCell(t)];
        return homeC + stepC * (pos[t] - 51);
    }

    bool finished() {
        for (int t = 0; t < 4; t++)
            if (pos[t] != 56) return false;
        return true;
    }
};
// child classes 
class Red : public Player {
public:
    Red() { start = 0; baseR = 2; baseC = 2; homeR = 7; homeC = 1; stepR = 0; stepC = 1; }
    string colour() { return "Red"; }
};

class Green : public Player {
public:
    Green() { start = 13; baseR = 2; baseC = 11; homeR = 1; homeC = 7; stepR = 1; stepC = 0; }
    string colour() { return "Green"; }
};

class Yellow : public Player {
public:
    Yellow() { start = 26; baseR = 11; baseC = 11; homeR = 7; homeC = 13; stepR = 0; stepC = -1; }
    string colour() { return "Yellow"; }
};

class Blue : public Player {
public:
    Blue() { start = 39; baseR = 11; baseC = 2; homeR = 13; homeC = 7; stepR = -1; stepC = 0; }
    string colour() { return "Blue"; }
};

Red red;
Green green;
Yellow yellow;
Blue blue;
Player* players[4] = {&red, &green, &yellow, &blue};

int seats[4], n = 4, turn = 0, dice = 0, sixes = 0, winner = -1;
bool waiting = false;
string msg;

Player* cur() { return players[seats[turn]]; }

void nextTurn() {
    turn = (turn + 1) % n;
    sixes = 0;
    waiting = false;
}

extern "C" {

void newGame(int count) {
    srand(time(0));
    buildPath();
    n = count;
    for (int i = 0; i < n; i++) seats[i] = (n == 2) ? i * 2 : i;
    for (int i = 0; i < 4; i++) players[i]->reset();
    turn = 0;
    dice = 0;
    sixes = 0;
    winner = -1;
    waiting = false;
    msg = cur()->colour() + " rolls the dice";
}

int rollDice() {
    if (waiting || winner >= 0) return dice;
    dice = rand() % 6 + 1;
    string who = cur()->colour();
    if (dice == 6) sixes++;
    else sixes = 0;
    if (sixes == 3) {
        msg = who + " rolled three sixes, turn lost";
        nextTurn();
    } else if (!cur()->hasMove(dice)) {
        msg = who + " rolled " + to_string(dice) + " and has no move";
        nextTurn();
    } else {
        waiting = true;
        msg = who + " rolled " + to_string(dice) + ", pick a token";
    }
    return dice;
}

void moveToken(int t) {
    Player* p = cur();
    if (!waiting || winner >= 0 || t < 0 || t > 3 || !p->canMove(t, dice)) return;
    if (p->pos[t] == -1) p->pos[t] = 0;
    else p->pos[t] += dice;
    bool bonus = (dice == 6);
    msg = p->colour() + " moved";
    if (p->onTrack(t) && !isSafe(p->trackCell(t))) {
        for (int i = 0; i < n; i++) {
            Player* o = players[seats[i]];
            if (o == p) continue;
            for (int k = 0; k < 4; k++) {
                if (o->onTrack(k) && o->trackCell(k) == p->trackCell(t)) {
                    o->pos[k] = -1;
                    bonus = true;
                    msg = p->colour() + " captured a " + o->colour() + " token";
                }
            }
        }
    }
    if (p->pos[t] == 56) {
        bonus = true;
        msg = p->colour() + " got a token home";
    }

    waiting = false;
    if (p->finished()) {
        winner = seats[turn];
        msg = p->colour() + " wins the game!";
        return;
    }
    
    if (bonus) msg += ", roll again";
    else nextTurn();
}

int tokenRow(int p, int t) { return players[p]->row(t); }
int tokenCol(int p, int t) { return players[p]->col(t); }

int isActive(int p) {
    for (int i = 0; i < n; i++)
        if (seats[i] == p) return 1;
    return 0;
}

int currentPlayer() { return seats[turn]; }
int getDice() { return dice; }
int getWinner() { return winner; }
int canMoveToken(int t) { return waiting && winner < 0 && cur()->canMove(t, dice); }
const char* getMessage() { return msg.c_str(); }

}