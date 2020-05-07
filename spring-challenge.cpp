#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

struct Position {
    int x;
    int y;

    int distanceTo(Position p) {
        return abs(p.x - x) + abs(p.y - y);
    }
};

struct Pac {
    int pacId; // pac number (unique within a team)
    Position pos; // position of pac in grid
    string typeId; // unused in wood leagues
    int speedTurnsLeft; // unused in wood leagues
    int abilityCooldown; // unused in wood leagues
};

struct Pellet {
    Position pos; // pellet position in grid
    int value; // amount of points this pellet is worth
};

class GameState {
public:
    int WIDTH, HEIGHT;
    int myScore, opponentScore;
    vector<string> grid;
    vector<Pac> pacs, enemies;
    vector<Pellet> pellets;

    GameState() {
        initGrid();
    }

    void initGrid() {
        cin >> WIDTH >> HEIGHT; cin.ignore();

        for (int i = 0; i < HEIGHT; i++) {
            string row;
            getline(cin, row); // one line of the grid: space " " is floor, pound "#" is wall
        }
    }

    void initGameState() {
        cin >> myScore >> opponentScore; cin.ignore();

        int visiblePacCount;
        cin >> visiblePacCount; cin.ignore();

        cerr << visiblePacCount << endl;

        for (int i = 0; i < visiblePacCount; i++) {
            int pacId; // pac number (unique within a team)
            bool mine; // true if this pac is yours
            int x; // position in the grid
            int y; // position in the grid
            string typeId; // unused in wood leagues
            int speedTurnsLeft; // unused in wood leagues
            int abilityCooldown; // unused in wood leagues
            cin >> pacId >> mine >> x >> y >> typeId >> speedTurnsLeft >> abilityCooldown; cin.ignore();

            if (mine) {
                pacs.push_back(Pac{pacId,{x,y},typeId,speedTurnsLeft,abilityCooldown});
            } else {
                enemies.push_back(Pac{pacId,{x,y},typeId,speedTurnsLeft,abilityCooldown});
            }
        }

        int visiblePelletCount; // all pellets in sight
        cin >> visiblePelletCount; cin.ignore();
        for (int i = 0; i < visiblePelletCount; i++) {
            int x;
            int y;
            int value; // amount of points this pellet is worth
            cin >> x >> y >> value; cin.ignore();
            pellets.push_back(Pellet{{x,y}, value});
        }
    }
};

class GameAI: private GameState {
private:
    GameState *gameState;
public:
    GameAI(GameState *_gameState) {
        gameState = _gameState;
    }

    void nextMove() {
        const vector<Pac> &pacs = this->gameState->pacs;
        // cerr << pacs.size() << " " << this->gameState->enemies.size() << endl;
        cout << "MOVE 0 15 0" << endl;
    }
};

int main()
{

    GameState gameState = GameState();
    GameAI ai{&gameState};

    while (1) {
        gameState.initGameState();
        ai.nextMove();
        // cout << "MOVE 0 15 0";
    }
}