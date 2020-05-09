#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

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
};

struct Pellet
{
    Position pos; // pellet position in grid
    int value;    // amount of points this pellet is worth

    bool isSuper() {
        return value == 10;
    }
};

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
    }

    void initUniversalGrid()
    {
        vector<vector<int>> tempGrid(height, vector<int>(width, 0));
        for (int i = 0; i < height; i++)
        {
            for (int j = 0; j < width; j++)
            {
                if (grid[i][j] == ' ')
                    tempGrid[i][j] = 1;
                // else if (grid[i][j] == '#')
                //     tempGrid[i][j] = 0;
            }
        }

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
            for (int x = pac.pos.x; x >= 0, grid[pac.pos.y][x] != '#'; x--)
                initIndex(x, pac.pos.y, tempGrid, grid);
            for (int y = pac.pos.y; y >= 0, grid[y][pac.pos.x] != '#'; y--)
                initIndex(pac.pos.x, y, tempGrid, grid);
            for (int x = pac.pos.x; x < width, grid[pac.pos.y][x] != '#'; x++)
                initIndex(x, pac.pos.y, tempGrid, grid);
            for (int y = pac.pos.y; y < height, grid[y][pac.pos.x] != '#'; y++)
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

    void nextMove()
    {
        vector<Pac> &pacs = gameState->pacs;
        vector<Pellet> &pellets = gameState->pellets;
        sort(pellets.begin(), pellets.end(), [](Pellet p1, Pellet p2) {
            return p1.value > p2.value;
        });
        for (int i = 0; i < pacs.size(); i++)
        {
            cout << "MOVE " << pacs[i].pacId << " " << pellets[i].pos.x << " " << pellets[i].pos.y;
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
        ai.debugUniversalGrid();
        ai.nextMove();
        // cout << "MOVE 0 15 0";
    }
}