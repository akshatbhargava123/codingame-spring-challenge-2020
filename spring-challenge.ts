// const readline = () => '';

const Entities = {
	EMPTY: ' ',
	WALL: '#',
	PAC: 'P',
	ENEMY: 'E',
	PELLET: 'o',
	SUPER_PELLET: 'O',
};

const Entity_Score = {
	[Entities.EMPTY]: -1,
	[Entities.WALL]: -1000,
	[Entities.PAC]: -10,
	[Entities.ENEMY]: -10,
	[Entities.PELLET]: 1,
	[Entities.SUPER_PELLET]: 10,
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
	isDead: boolean = false;

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

	isSuper() {
		return this.value === 10;
	}
};

class Grid<T> {
	width: number;
	height: number;
	grid: T[][];

	constructor(width: number, height: number, cellDefaultValue?: any) {
		this.width = width;
		this.height = height;
		this.grid = [];
		for (let y = 0; y < height; y++) {
			this.grid.push([]);
			for (let x = 0; x < width; x++) {
				this.grid[y].push(cellDefaultValue);
			}
		}
	}

	get(pos: Position): T {
		return this.grid[pos.y][pos.x];
	}

	set(pos: Position, value: T) {
		this.grid[pos.y][pos.x] = value;
	}

	setRow(rowIndex: number, row: T[]) {
		this.grid[rowIndex] = row;
	}

	checkBounds(pos: Position) {
		const { width, height } = this;
		return !(pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height);
	}

	debug() {
		for (let row of this.grid) {
			let outputStr = '';
			for (let col of row) {
				outputStr += col;
			}
			console.error(outputStr);
		}
		console.error('\n');
	}
};

class GameState {
	grid: Grid<string>;
	universalGrid: Grid<number>;

	myScore: number;
	opponentScore: number;

	pacs = [] as Pac[];
	enemies = [] as Pac[];
	pellets = [] as Pellet[];

	constructor() {
		this.initGrid();
	}

	initGrid() {
		const inputs: string[] = readline().split(' ');
		const width = parseInt(inputs[0]);
		const height = parseInt(inputs[1]);

		this.grid = new Grid<string>(width, height, '');
		this.universalGrid = new Grid<number>(width, height, 0);

		for (let i = 0; i < height; i++) {
			const row: string = readline();
			this.grid.setRow(i, row.split(''));
		}
		console.error(inputs);
	}

	resetGridState() {
		for (let y = 0; y < this.grid.height; y++) {
			for (let x = 0; x < this.grid.width; x++) {
				if (this.grid.get(new Position(x, y)) !== Entities.WALL) {
					this.grid.set(new Position(x, y), Entities.EMPTY);
				}
			}
		}
	}

	initGameState() {
		this.resetGridState();

		const pacInput = [];
		const pelletInput = [];

		const initialInputs: string[] = readline().split(' ');
		this.myScore = parseInt(initialInputs[0]);
		this.opponentScore = parseInt(initialInputs[1]);

		const visiblePacCount: number = parseInt(readline());
		for (let i = 0; i < visiblePacCount; i++) {
			const inputs: string[] = readline().split(' ');
			const pacId: number = parseInt(inputs[0]);
			const mine: boolean = inputs[1] !== '0';
			const x: number = parseInt(inputs[2]);
			const y: number = parseInt(inputs[3]);
			const typeId: string = inputs[4];
			const speedTurnsLeft: number = parseInt(inputs[5]);
			const abilityCooldown: number = parseInt(inputs[6]);

			pacInput.push({ pacId, mine, x, y, typeId, speedTurnsLeft, abilityCooldown });
		}

		const visiblePelletCount: number = parseInt(readline());
		for (let i = 0; i < visiblePelletCount; i++) {
			const inputs: string[] = readline().split(' ');
			const x: number = parseInt(inputs[0]);
			const y: number = parseInt(inputs[1]);
			const value: number = parseInt(inputs[2]);

			pelletInput.push({ x, y, value });
		}

		const createOrUpdatePac = (pacArray: Array<Pac>, { pacId, x, y, typeId, speedTurnsLeft, abilityCooldown }) => {
			const pacInstance = pacArray.find(pac => pac.id === pacId);
			if (pacInstance) {
				pacInstance.typeId = typeId;
				pacInstance.pos = new Position(x, y);
				pacInstance.speedTurnsLeft = speedTurnsLeft;
				pacInstance.abilityCooldown = abilityCooldown;
			} else {
				pacArray.push(new Pac(pacId, new Position(x, y), typeId, speedTurnsLeft, abilityCooldown));
			}
		};

		pacInput.forEach(({ mine, ...pacInfo }) => {
			if (mine) {
				createOrUpdatePac(this.pacs, pacInfo);
			} else {
				createOrUpdatePac(this.enemies, pacInfo);
			}
		});

		const updateDeadStatus = (pacArray: Array<Pac>, pacInput: any[]) => {
			pacArray.forEach(pac => {
				const found = pacInput.some(p => p.pacId === pac.id);
				if (!found) pac.isDead = true;
			});
		};

		updateDeadStatus(this.pacs, pacInput);
		updateDeadStatus(this.enemies, pacInput);

		this.pellets = pelletInput;

		// console.error(this.pacs);
		// console.error(this.enemies);
		// console.error(this.pellets);
		this.grid.debug();
		this.updateUniversalGrid();
	}

	updateUniversalGrid() {
		// for each pac, go through visibility area and update grid
		for (let pac of this.pacs) {
			for (let x = pac.pos.x; x < this.grid.width; x++) {
				if (this.grid.get(new Position(x, pac.pos.y)) === Entities.EMPTY)
					this.universalGrid.set(new Position(x, pac.pos.y), 0);
			}

			for (let x = pac.pos.x; x >= 0; x--) {
				if (this.grid.get(new Position(x, pac.pos.y)) === Entities.EMPTY)
					this.universalGrid.set(new Position(x, pac.pos.y), 0);
			}

			for (let y = pac.pos.y; y < this.grid.height; y++) {
				if (this.grid.get(new Position(pac.pos.x, y)) === Entities.EMPTY)
					this.universalGrid.set(new Position(pac.pos.x, y), 0);
			}

			for (let y = pac.pos.y; y >= 0; y--) {
				if (this.grid.get(new Position(pac.pos.x, y)) === Entities.EMPTY)
					this.universalGrid.set(new Position(pac.pos.x, y), 0);
			}
		}

		// this.universalGrid.debug();
	}
};

class GameAI {
	gameState: GameState;

	constructor(gameState: GameState) {
		this.gameState = gameState;
	}

	initDistance(pacs: Pac[]) {
		// const { grid } = this.gameState;
		// const visited: { [y: number]: { [x: number]: { pacId: number, value: number } } } = {};

		// const queue: { pacId: number, pos: Position, value: number }[] = [];
		// pacs.forEach(pac => queue.push({ pacId: pac.id, pos: pac.pos, value: 0 }));

		// while (queue.length) {
		// 	let positions = queue.length;
		// 	while (positions--) {
		// 		const { pacId, value, pos } = queue.shift();
		// 		if (!grid.checkBounds(pos)) continue;

		// 		if (visited[pos.y] && visited[pos.y][pos.x]) continue;

		// 		let newVal = value;
		// 		if (grid[pos.y][pos.x] === Entities.PELLET) newVal += 1;
		// 		else if (grid[pos.y][pos.x] === Entities.SUPER_PELLET) newVal += 10;
		// 		else if (grid[pos.y][pos.x] === Entities.ENEMY) newVal -= 10;
		// 		else if (grid[pos.y][pos.x] === Entities.PAC) newVal -= 10;

		// 		if (!visited[pos.y]) visited[pos.y] = {};
		// 		visited[pos.y][pos.x] = { pacId, value };

		// 		const rightPos = new Position(pos.x + 1, pos.y);
		// 		const leftPos = new Position(pos.x - 1, pos.y);
		// 		const topPos = new Position(pos.x, pos.y - 1);
		// 		const bottomPos = new Position(pos.x, pos.y + 1);

		// 		if (![Entities.WALL].includes(grid[rightPos.y][rightPos.x])) {
		// 			queue.push({ pacId, pos: rightPos, value: newVal });
		// 		}

		// 		if (![Entities.WALL].includes(grid[leftPos.y][leftPos.x])) {
		// 			queue.push({ pacId, pos: leftPos, value: newVal });
		// 		}

		// 		if (![Entities.WALL].includes(grid[topPos.y][topPos.x])) {
		// 			queue.push({ pacId, pos: topPos, value: newVal });
		// 		}

		// 		if (![Entities.WALL].includes(grid[bottomPos.y][bottomPos.x])) {
		// 			queue.push({ pacId, pos: bottomPos, value: newVal });
		// 		}
		// 	}
		// }

		// const result: { value: number, pos: Position }[] = Array(pacs.length).fill(null);
		// for (let y in visited) {
		// 	let str = '';
		// 	for (let x in visited[y]) {
		// 		str += visited[y][x].value + ' ';
		// 		const { pacId, value } = visited[y][x];
		// 		if (!result[pacId]) {
		// 			result[pacId] = { value, pos: new Position(Number(x), Number(y)) };
		// 		} else if (result[pacId].value < value) {
		// 			result[pacId] = { value, pos: new Position(Number(x), Number(y)) };
		// 		}
		// 	}
		// 	console.error(str);
		// }

		// console.error(result);
		// return result;
	}

	playNextMove() {
		const { pacs, pellets } = this.gameState;
		const alivePacs = pacs.filter(pac => !pac.isDead);

		let output = '';
		for (let i = 0; i < alivePacs.length; i++) {
			const pac = alivePacs[i];
			if (pac.isDead) continue;

			output += (`MOVE ${pac.id} 15 0`);
			if (i !== alivePacs.length - 1) {
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
		gameAI.playNextMove();
	}

}

RunGame();
