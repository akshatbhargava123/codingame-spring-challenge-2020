#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <queue>
#include <tuple>

using namespace std;

struct Position
{
    int x;
    int y;

    bool operator == (Position p) {
        return (this->x == p.x) && (this->y == p.y);
    }
};

struct Pac
{
    int pacId;           // pac number (unique within a team)
    Position pos;        // position of pac in grid
    string typeId;       // unused in wood leagues
    int speedTurnsLeft;  // unused in wood leagues
    int abilityCooldown; // unused in wood leagues

    bool isAbilityAvailable() {
        return abilityCooldown == 0;
    }
};

struct Pellet
{
    Position pos; // pellet position in grid
    int value;    // amount of points this pellet is worth

    bool isSuper() {
        return value == 10;
    }
};

// TODO: Universal Grid cannot yet differentiate between WALL and EMPTY, maybe merge it with GRID in future
class GameState
{
public:
    int width, height;
    int myScore, opponentScore;
    vector<vector<char>> grid;
    vector<vector<int>> universalGrid;
    vector<Pac> pacs, enemies;
    vector<Pellet> pellets;

    GameState()
    {
        initGrid();
    }

    void initGrid()
    {
        cin >> width >> height;
        cin.ignore();

        vector<vector<char>> tempGrid(height, vector<char>(width, ' '));

        for (int i = 0; i < height; i++)
        {
            string row;
            getline(cin, row);
            for (int j = 0; j < width; j++)
            {
                tempGrid[i][j] = row[j];
            }
        }

        this->grid = tempGrid;

        vector<vector<int>> tempUniversalGrid(height, vector<int>(width, 0));
        for (int i = 0; i < height; i++)
        {
            for (int j = 0; j < width; j++)
            {
                if (grid[i][j] == ' ')
                    tempUniversalGrid[i][j] = 1;
                // else if (grid[i][j] == '#')
                //     tempGrid[i][j] = 0;
            }
        }
        this->universalGrid = tempUniversalGrid;
    }

    void removeStateFromGrid()
    {
        for (int i = 0; i < grid.size(); i++)
        {
            for (int j = 0; j < grid[i].size(); j++)
            {
                if (grid[i][j] != '#')
                    grid[i][j] = ' ';
            }
        }
    }

    void initUniversalGrid()
    {
        vector<vector<int>> tempGrid(height, vector<int>(width, 0));

        auto initIndex = [](int posx, int posy, auto &tempGrid, auto &grid) {
            if (grid[posy][posx] == ' ')
                tempGrid[posy][posx] = 0;
            else if (grid[posy][posx] == 'o')
                tempGrid[posy][posx] = 2;
            else if (grid[posy][posx] == 'O')
                tempGrid[posy][posx] = 10;
        };

        for (Pac pac : pacs)
        {
            for (int x = pac.pos.x; x >= 0 && grid[pac.pos.y][x] != '#'; x--)
                initIndex(x, pac.pos.y, tempGrid, grid);
            for (int y = pac.pos.y; y >= 0 && grid[y][pac.pos.x] != '#'; y--)
                initIndex(pac.pos.x, y, tempGrid, grid);
            for (int x = pac.pos.x; x < width && grid[pac.pos.y][x] != '#'; x++)
                initIndex(x, pac.pos.y, tempGrid, grid);
            for (int y = pac.pos.y; y < height && grid[y][pac.pos.x] != '#'; y++)
                initIndex(pac.pos.x, y, tempGrid, grid);
        }

        for (Pellet pellet : pellets)
        {
            tempGrid[pellet.pos.y][pellet.pos.x] = pellet.value == 10 ? 10 : 2;
        }

        universalGrid = tempGrid;

        // cerr << "universal grid initialised...\n";
    }

    void initGameState()
    {
        pacs.clear();
        enemies.clear();
        pellets.clear();
        removeStateFromGrid();

        cin >> myScore >> opponentScore;
        cin.ignore();

        int visiblePacCount;
        cin >> visiblePacCount;
        cin.ignore();

        // cerr << "basic input done...\n";

        for (int i = 0; i < visiblePacCount; i++)
        {
            int pacId, x, y, speedTurnsLeft, abilityCooldown;
            bool mine;
            string typeId;
            cin >> pacId >> mine >> x >> y >> typeId >> speedTurnsLeft >> abilityCooldown;
            cin.ignore();

            if (mine)
            {
                pacs.push_back(Pac{pacId, {x, y}, typeId, speedTurnsLeft, abilityCooldown});
            }
            else
            {
                enemies.push_back(Pac{pacId, {x, y}, typeId, speedTurnsLeft, abilityCooldown});
            }

            if (mine)
                this->grid[y][x] = 'P';
            else
                this->grid[y][x] = 'E';
        }

        // cerr << "pacs input done...\n";

        int visiblePelletCount;
        cin >> visiblePelletCount;
        cin.ignore();
        for (int i = 0; i < visiblePelletCount; i++)
        {
            int x, y, value;
            cin >> x >> y >> value;
            cin.ignore();

            pellets.push_back(Pellet{{x, y}, value});

            this->grid[y][x] = value == 10 ? 'O' : 'o';
        }

        // cerr << "pellets input done...\n";

        this->initUniversalGrid();
    }
};

class GameAI
{
private:
    GameState *gameState;

public:
    GameAI(GameState *_gameState)
    {
        gameState = _gameState;
    }

    void debugGrid()
    {
        auto grid = gameState->grid;
        for (auto row : grid)
        {
            for (auto ch : row)
            {
                cerr << ch;
            }
            cerr << endl;
        }
    }

    void debugUniversalGrid()
    {
        // while debugging show super pellets as 9 instead of 10
        auto grid = gameState->universalGrid;
        for (auto row : grid)
        {
            for (int ch : row)
            {
                if (ch == 10) ch = 9;
                cerr << ch << " ";
            }
            cerr << endl;
        }
    }

    Position getBestMovePosition(Pac pac, vector<vector<int>> &universalGridCopy) {
        const Position pos = pac.pos;
        const int width = this->gameState->width;
        const int height = this->gameState->height;

        const auto grid = this->gameState->grid;
        auto universalGrid = universalGridCopy;
        vector<vector<int>> scores(height, vector<int>(width, 0));
        vector<vector<bool>> visited(height, vector<bool>(width, false));

        auto getEntity = [=](Position pos) -> char {
            return grid[pos.y][pos.x];
        };

        auto setScore = [&](Position pos, int value) {
            if (scores[pos.y][pos.x] < value) scores[pos.y][pos.x] = value;
        };

        auto setVisited = [&](Position pos) {
            visited[pos.y][pos.x] = true;
        };

        Position superBestPos;

        // BFS lambda to encapsulate logic
        function<void(Position)> BFS = [&](Position curPos) {
            // if (depth > 15) return 1;
            queue<tuple<Position,int,int>> Q; // position, score, depth
            Q.push({ curPos, 0, 0 });

            while (!Q.empty()) {
                int size = Q.size();
                while (size--) {
                    auto [pos, score, depth] = Q.front();
                    Q.pop();

                    if (visited[pos.y][pos.x]) continue;

                    // check if wall then return
                    if (getEntity(pos) == '#') {
                        setVisited(pos);
                        continue;
                    }

                    // if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) continue;

                    // initialise all direction positions correctly
                    Position tPos, bPos, rPos, lPos;

                    if (pos.x == 0) lPos = Position{width - 1, pos.y};
                    else lPos = Position{pos.x - 1, pos.y};

                    if (pos.x == width - 1) rPos = Position{0, pos.y};
                    else rPos = Position{pos.x + 1, pos.y};

                    if (pos.y == 0) tPos = Position{pos.x, height - 1};
                    else tPos = Position{pos.x, pos.y - 1};

                    if (pos.y == height - 1) bPos = Position{pos.x, 0};
                    else bPos = Position{pos.x, pos.y + 1};

                    // TODO: think more on this: adding -1 as a cost to walk
                    int newVal = score + universalGrid[pos.y][pos.x];
                    setScore(pos, newVal);
                    universalGrid[pos.y][pos.x] = -1000;

                    Q.push({ tPos, newVal, depth + 1 });
                    Q.push({ bPos, newVal, depth + 1 });
                    Q.push({ lPos, newVal, depth + 1 });
                    Q.push({ rPos, newVal, depth + 1 });

                    setVisited(pos);
                }
            }

        };

        BFS(pac.pos);

        int bestScore = 0;
        Position bestPos = pac.pos;
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int score = scores[i][j];
                // cerr << score << " ";

                if (score > bestScore) {
                    bestScore = score;
                    bestPos = Position{j,i};
                }
            }
            // cerr << endl;
        }

        // cerr << "id: " << pac.pacId << " score: " << bestScore << endl;
        // cerr << bestPos.x << " " << bestPos.y << endl << endl;

        return bestPos;
    }

    void nextMove()
    {
        vector<Pac> &pacs = gameState->pacs;
        vector<Pellet> &pellets = gameState->pellets;

        vector<vector<int>> universalGridCopy = this->gameState->universalGrid;

        vector<Position> targets;
        for (int i = 0; i < pacs.size(); i++)
        {
            Pac &pac = pacs[i];

            if (false && i > 0) {
                // for debugging
                cout << "MOVE " << pac.pacId << " " << pac.pos.x << " " << pac.pos.y;
            } else {
                // if SPEED ability available, just use it
                if (pac.isAbilityAvailable()) {
                    cout << "SPEED " << pac.pacId;
                } else {
                    Position pos = this->getBestMovePosition(pac, universalGridCopy);
                    if (find(targets.begin(), targets.end(), pos) != targets.end()) {
                        cout << "MOVE " << pac.pacId << " " << pac.pos.x << " " << pac.pos.y;
                    } else {
                        cout << "MOVE " << pac.pacId << " " << pos.x << " " << pos.y;
                    }
                    targets.push_back(pos);
                }
            }


            if (i != pacs.size() - 1)
                cout << "|";
        }
        cout << endl;
    }
};

int main()
{

    GameState gameState = GameState();
    GameAI ai{&gameState};

    while (1)
    {
        gameState.initGameState();
        // ai.debugUniversalGrid();
        ai.nextMove();
    }
}