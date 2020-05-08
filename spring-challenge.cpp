#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

struct Position
{
    int x;
    int y;
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
};

class GameState
{
public:
    int width, height;
    int myScore, opponentScore;
    vector<vector<char>> grid;
    vector<vector<char>> universalGrid;
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

    initUniversalGrid()
    {
        vector<vector<char>> tUniversalGrid(height, vector<char>(width, ' '));
        for (int i = 0; i < height; i++)
        {
            for (int j = 0; j < width; j++)
            {
                if (grid[i][j] == ' ')
                    universalGrid[i][j] = 'o';
                else if (grid[i][j] == '#')
                    universalGrid[i][j] = '#';
            }
        }

        for (Pac pac : this->pacs)
        {
            for (int x = pac.pos.x; x >= 0; x--)
                tUniversalGrid[pac.pos.y][x] = grid[pac.pos.y][x];
            for (int y = pac.pos.y; y >= 0; y--)
                tUniversalGrid[y][pac.pos.x] = grid[y][pac.pos.x];

            for (int x = pac.pos.x; x < width; x++)
                tUniversalGrid[y][pac.pos.x] = grid[y][pac.pos.x];
            for (int y = pac.pos.y; y < height; y++)
                tUniversalGrid[y][pac.pos.x] = grid[y][pac.pos.x];
        }

        for (Pellet pellet : pellets)
        {
            universalGrid[pellet.pos.y][pellet.pos.x] = pellet.value == 10 ? 'O' : 'o';
        }

        this->universalGrid = tUniversalGrid;
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
                grid[y][x] = 'P';
            else
                grid[y][x] = 'E';
        }

        int visiblePelletCount;
        cin >> visiblePelletCount;
        cin.ignore();
        for (int i = 0; i < visiblePelletCount; i++)
        {
            int x, y, value;
            cin >> x >> y >> value;
            cin.ignore();

            pellets.push_back(Pellet{{x, y}, value});

            grid[y][x] = value == 10 ? 'O' : 'o';
        }
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
        const vector<vector<char>> grid = gameState->grid;
        for (auto row : grid)
        {
            for (char ch : row)
            {
                cerr << ch;
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
        ai.debugGrid();
        ai.nextMove();
        // cout << "MOVE 0 15 0";
    }
}