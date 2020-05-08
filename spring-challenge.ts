// const readline = () => '';

const GRID_ELEMENTS = {
	EMPTY: ' ',
	WALL: '#',
	PAC: 'P',
	ENEMY: 'E',
	PELLET: 'o',
	SUPER_PELLET: 'O',
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

	playNextMove() {
		const { myPacs, pellets } = this.gameState;
		const sortedPellets = pellets.sort((p1, p2) => p1.value > p2.value ? -1 : 1);

		let output = '';
		for (let i = 0; i < myPacs.length; i++) {
			const pac = myPacs[i];
			const pellet = sortedPellets[i];
			output += `MOVE ${pac.id} ${pellet.pos.x} ${pellet.pos.y}`;
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
