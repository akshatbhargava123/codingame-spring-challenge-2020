// const readline = () => '';

const GRID_ELEMENTS = {
	EMPTY: ' ',
	WALL: '#',
	PAC: 'P',
	ENEMY: 'E',
	PELLET: 'o',
	SUPER_PELLET: 'O',
};

const GRID_ELEMENT_SCORES = {
	[GRID_ELEMENTS.EMPTY]: -1,
	[GRID_ELEMENTS.WALL]: -1000,
	[GRID_ELEMENTS.PAC]: -10,
	[GRID_ELEMENTS.ENEMY]: -10,
	[GRID_ELEMENTS.PELLET]: 1,
	[GRID_ELEMENTS.SUPER_PELLET]: 10,
};

class Position {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
};

class Pac {
	id: number;
	pos: Position;
	typeId: string;
	speedTurnsLeft: number;
	abilityCooldown: number;

	constructor(id: number, pos: Position, _typeId: string, _speedTurnsLeft: number, _abilityCooldown: number) {
		this.id = id;
		this.pos = pos;
		this.typeId = _typeId;
		this.speedTurnsLeft = _speedTurnsLeft;
		this.abilityCooldown = _abilityCooldown;
	}

};

class Pellet {
	pos: Position;
	value: number;

	constructor(pos: Position, value: number) {
		this.pos = pos;
		this.value = value;
	}
};

class GameState {
	gridWidth: number;
	gridHeight: number;
	grid: string[][] = [];

	myScore: number;
	opponentScore: number;

	myPacs = [] as Pac[];
	opponentPacs = [] as Pac[];
	pellets = [] as Pellet[];

	constructor() {
		this.initGrid();
	}

	initGrid() {
		const inputs: string[] = readline().split(' ');
		const width = parseInt(inputs[0]); // size of the grid
		const height = parseInt(inputs[1]); // top left corner is (x=0, y=0)
		for (let i = 0; i < height; i++) {
			const row: string = readline(); // one line of the grid: space " " is floor, pound "#" is wall
			for (let j = 0; j < width; j++) {
				if (!this.grid[i]) this.grid[i] = [];
				this.grid[i].push(row[j]);
			}
		}
		this.gridWidth = width;
		this.gridHeight = height;
	}

	resetGridState() {
		for (let i = 0; i < this.gridHeight; i++) {
			for (let j = 0; j < this.gridWidth; j++) {
				if (this.grid[i][j] !== GRID_ELEMENTS.WALL) {
					this.grid[i][j] = GRID_ELEMENTS.EMPTY;
				}
			}
		}
	}

	initGameState() {
		this.myPacs = [];
		this.opponentPacs = [];
		this.pellets = [];
		this.resetGridState();

		const initialInputs: string[] = readline().split(' ');
		this.myScore = parseInt(initialInputs[0]);
		this.opponentScore = parseInt(initialInputs[1]);

		const visiblePacCount: number = parseInt(readline()); // all your pacs and enemy pacs in sight
		for (let i = 0; i < visiblePacCount; i++) {
			var inputs: string[] = readline().split(' ');
			const pacId: number = parseInt(inputs[0]); // pac number (unique within a team)
			const mine: boolean = inputs[1] !== '0'; // true if this pac is yours
			const x: number = parseInt(inputs[2]); // position in the grid
			const y: number = parseInt(inputs[3]); // position in the grid
			const typeId: string = inputs[4]; // unused in wood leagues
			const speedTurnsLeft: number = parseInt(inputs[5]); // unused in wood leagues
			const abilityCooldown: number = parseInt(inputs[6]); // unused in wood leagues

			const pacInstance = new Pac(pacId, new Position(x, y), typeId, speedTurnsLeft, abilityCooldown);

			if (mine) {
				this.grid[y][x] = GRID_ELEMENTS.PAC;
				this.myPacs.push(pacInstance);
			} else {
				this.grid[y][x] = GRID_ELEMENTS.ENEMY;
				this.opponentPacs.push(pacInstance);
			}
		}

		const visiblePelletCount: number = parseInt(readline()); // all pellets in sight
		for (let i = 0; i < visiblePelletCount; i++) {
			var inputs: string[] = readline().split(' ');
			const x: number = parseInt(inputs[0]);
			const y: number = parseInt(inputs[1]);
			const value: number = parseInt(inputs[2]); // amount of points this pellet is worth

			const pelletInstance = new Pellet(new Position(x, y), value);
			this.pellets.push(pelletInstance);

			if (value === 10) {
				this.grid[y][x] = GRID_ELEMENTS.SUPER_PELLET;
			} else {
				this.grid[y][x] = GRID_ELEMENTS.PELLET;
			}
		}
	}
};

class GameAI {
	gameState: GameState;

	constructor(gameState: GameState) {
		this.gameState = gameState;
	}

	debugGrid() {
		const { grid, gridWidth, gridHeight } = this.gameState;
		for (let i = 0; i < gridHeight; i++) {
			let row = '';
			for (let j = 0; j < gridWidth; j++) {
				row += grid[i][j] + ' ';
			}
			row += ' ';
			console.error(row);
		}
	}

	findProfitablePellet(posX: number, posY: number, maxVal: number = 1, visited = {}): { x: number, y: number, maxVal: number } {
		const { grid, gridWidth, gridHeight } = this.gameState;

		if (posX < 0 || posX >= gridWidth || posY < 0 || posY >= gridHeight) {
			return { x: posX, y: posY, maxVal: -1000 };
		}

		if (visited[posY] && visited[posY][posX]) return { x: posX, y: posY, maxVal };

		if (grid[posY][posX] === GRID_ELEMENTS.WALL) return { x: posX, y: posY, maxVal: -1000 };
		if (grid[posY][posX] === GRID_ELEMENTS.SUPER_PELLET) return { x: posX, y: posY, maxVal: 10 };

		if (!visited[posY]) visited[posY] = {};
		visited[posY][posX] = true;

		const right = this.findProfitablePellet(posX + 1, posY, maxVal, visited);
		const left = this.findProfitablePellet(posX - 1, posY, maxVal, visited);
		const top = this.findProfitablePellet(posX, posY + 1, maxVal, visited);
		const bottom = this.findProfitablePellet(posX, posY - 1, maxVal, visited);

		let goodX, goodY;
		if (right.maxVal > left.maxVal) {
			goodX = right;
		} else {
			goodX = left;
		}

		if (top.maxVal > bottom.maxVal) {
			goodY = top;
		} else {
			goodY = bottom;
		}

		return goodX.maxVal > goodY.maxVal ? goodX : goodY;
	}

	playNextMove() {
		const { myPacs, pellets } = this.gameState;

		let output = '';
		for (let i = 0; i < myPacs.length; i++) {
			const pac = myPacs[i];
			const move = this.findProfitablePellet(pac.pos.x, pac.pos.y, 0, {});
			output += `MOVE ${pac.id} ${move.x} ${move.y}`;
			if (i !== myPacs.length - 1) {
				output += '|';
			}
		}
		console.log(output);
	}

};

function RunGame() {
	const gameState = new GameState();
	const gameAI = new GameAI(gameState);

	while (true) {
		gameState.initGameState();
		gameAI.debugGrid();
		gameAI.playNextMove();
	}

}

RunGame();
