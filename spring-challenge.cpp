#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

struct Position {
    int x;
    int y;
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
            grid.push_back(row);
        }
    }

    void initGameState() {
        pacs.clear();
        enemies.clear();
        pellets.clear();
        removeStateFromGrid();

        cin >> myScore >> opponentScore; cin.ignore();

        int visiblePacCount;
        cin >> visiblePacCount; cin.ignore();

        for (int i = 0; i < visiblePacCount; i++) {
            int pacId; // pac number (unique within a team)
            bool mine; // true if this pac is yours
            int x; // position in the grid
            int y; // position in the grid
            string typeId; // unused in wood leagues
            int speedTurnsLeft; // unused in wood leagues
            int abilityCooldown; // unused in wood leagues
            cin >> pacId >> mine >> x >> y >> typeId >> speedTurnsLeft >> abilityCooldown; cin.ignore();

            if (mine) grid[y][x] = '';
            else grid[y][x] = 'E';

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
            if (grid[y][x] != 'E' && grid[y][x] != 'P') grid[y][x] = value == 10 ? 'O' : 'o';
        }
    }

    void removeStateFromGrid() {
        for (int i = 0; i < grid.size(); i++) {
            for (int j = 0; j < grid[i].size(); j++) {
                if (grid[i][j] != '#') grid[i][j] = ' ';
            }
        }
    }
};

class GameAI {
private:
    GameState *gameState;
public:
    GameAI(GameState *_gameState) {
        gameState = _gameState;
    }

    void debugGrid() {
        const vector<string> grid = gameState->grid;
        for (auto row: grid) {
            for (char ch: row) {
                cerr << ch << " ";
            }
            cerr << endl;
        }
    }

    void nextMove() {
        vector<Pac> &pacs = gameState->pacs;
        vector<Pellet> &pellets = gameState->pellets;
        sort(pellets.begin(), pellets.end(), [](Pellet p1, Pellet p2) {
            return p1.value > p2.value;
        });
        for (int i = 0; i < pacs.size(); i++) {
            cout << "MOVE " << pacs[i].pacId << " " << pellets[i].pos.x << " " << pellets[i].pos.y;
            if (i != pacs.size() - 1) cout << "|";
        }
        cout << endl;
    }
};

int main()
{

    GameState gameState = GameState();
    GameAI ai{&gameState};

    while (1) {
        gameState.initGameState();
        ai.debugGrid();
        ai.nextMove();
        // cout << "MOVE 0 15 0";
    }
}