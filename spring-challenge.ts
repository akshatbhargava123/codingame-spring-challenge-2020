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
	isDead: boolean;

	constructor(id: number, pos: Position, _typeId: string, _speedTurnsLeft: number, _abilityCooldown: number) {
		this.id = id;
		this.pos = pos;
		this.typeId = _typeId;
		this.speedTurnsLeft = _speedTurnsLeft;
		this.abilityCooldown = _abilityCooldown;
		this.isDead = false;
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
				let colStr = String(col);
				outputStr += colStr;

				if (colStr.length === 2) outputStr += ' ';
				else outputStr += ' ';
			}
			console.error(outputStr);
		}
		console.error('\n\n');
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
		this.universalGrid = new Grid<number>(width, height, 1);

		for (let i = 0; i < height; i++) {
			const row: string = readline();
			this.grid.setRow(i, row.split(''));
		}
	}

	resetGridState() {
		for (let y = 0; y < this.grid.height; y++) {
			for (let x = 0; x < this.grid.width; x++) {
				if (this.grid.get(new Position(x, y)) !== Entities.WALL) {
					this.grid.set(new Position(x, y), Entities.EMPTY);
				} else {
					this.universalGrid.set(new Position(x, y), 0);
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
			this.grid.set(new Position(x, y), value === 10 ? 'O' : 'o');
			this.universalGrid.set(new Position(x, y), value);
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

			this.grid.set(new Position(pacInfo.x, pacInfo.y), mine ? 'P' : 'E');
			this.universalGrid.set(new Position(pacInfo.x, pacInfo.y), -5);
		});

		const updateDeadStatus = (pacArray: Array<Pac>, pacInput: any[]) => {
			if (pacArray.length === pacInput.length) return;
			pacArray.forEach(pac => {
				const found = pacInput.filter(p => p.pacId === pac.id).length > 0;
				if (!found) {
					pac.isDead = true;
					console.error(`${pac.id} not found in input, turning dead.`);
				}
			});
		};

		updateDeadStatus(this.pacs, pacInput.filter(p => p.mine));
		// updateDeadStatus(this.enemies, pacInput);

		this.pellets = pelletInput;

		// console.error(this.pacs);
		// console.error(this.enemies);
		// console.error(this.pellets);

		this.updateUniversalGrid();
	}

	updateUniversalGrid() {
		// for each pac, go through visibility area and update grid

		for (let pac of this.pacs) {
			for (let x = pac.pos.x; x < this.grid.width; x++) {
				const pos = new Position(x, pac.pos.y);
				if (this.grid.get(pos) === Entities.WALL) break;
				if (this.grid.get(pos) === Entities.EMPTY)
					this.universalGrid.set(pos, 0);
			}

			for (let x = pac.pos.x; x >= 0; x--) {
				const pos = new Position(x, pac.pos.y);
				if (this.grid.get(pos) === Entities.WALL) break;
				if (this.grid.get(pos) === Entities.EMPTY)
					this.universalGrid.set(pos, 0);
			}

			for (let y = pac.pos.y; y < this.grid.height; y++) {
				const pos = new Position(pac.pos.x, y);
				if (this.grid.get(pos) === Entities.WALL) break;
				if (this.grid.get(pos) === Entities.EMPTY)
					this.universalGrid.set(pos, 0);
			}

			for (let y = pac.pos.y; y >= 0; y--) {
				const pos = new Position(pac.pos.x, y);
				if (this.grid.get(pos) === Entities.WALL) break;
				if (this.grid.get(pos) === Entities.EMPTY)
					this.universalGrid.set(pos, 0);
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

	getBestMove(pac: Pac): Position {
		const { grid, universalGrid } = this.gameState;
		const scores = new Grid<number>(grid.width, grid.height, 0);
		const distances = new Grid<number>(grid.width, grid.height, 0);
		const visited = new Grid<boolean>(grid.width, grid.height, false);

		const setScore = (pos: Position, value: number) => {
			if (value > scores.get(pos)) {
				scores.set(pos, value);
			}
		};
		
		const setDistance = (pos: Position, value: number) => {
			if (value > distances.get(pos)) {
				distances.set(pos, value);
			}
		};

		const BFS = (initialPos: Position) => {
			let Q: { pos: Position, score: number, distance: number }[] = [];
			Q.push({ pos: { ...initialPos }, score: 0, distance: 0 });

			while (Q.length) {
				let size = Q.length;
				while (size--) {
					const { pos, score, distance } = Q.shift();

					if (visited.get(pos)) continue;
					if (grid.get(pos) === Entities.WALL) continue;

					let tPos: Position, bPos: Position, rPos: Position, lPos: Position;
					if (pos.x == 0) lPos = new Position(grid.width - 1, pos.y);
					else lPos = new Position(pos.x - 1, pos.y);

					if (pos.x == grid.width - 1) rPos = new Position(0, pos.y);
					else rPos = new Position(pos.x + 1, pos.y);

					if (pos.y == 0) tPos = new Position(pos.x, grid.height - 1);
					else tPos = new Position(pos.x, pos.y - 1);

					if (pos.y == grid.height - 1) bPos = new Position(pos.x, 0);
					else bPos = new Position(pos.x, pos.y + 1);

					// TODO: think more on this: adding -1 as a cost to walk
					let newVal: number = score + universalGrid.get(pos);
					setScore(pos, newVal);
					setDistance(pos, distance);

					Q.push({ pos: tPos, score: newVal, distance: distance + 1 });
					Q.push({ pos: bPos, score: newVal, distance: distance + 1 });
					Q.push({ pos: lPos, score: newVal, distance: distance + 1 });
					Q.push({ pos: rPos, score: newVal, distance: distance + 1 });

					visited.set(pos, true);
				}
			};
		};

		BFS(pac.pos);

		let bestScore: number = -1000, bestPos: Position = pac.pos;
		for (let y = 0; y < grid.height; y++) {
			for (let x = 0; x < grid.width; x++) {
				const pos = new Position(x, y);
				let distance = distances.get(pos), profit = scores.get(pos);
				const score = profit - distance;
				if (score > bestScore) {
					bestScore = score;
					bestPos = pos;
				}
			}
		}

		// universalGrid.debug();
		// scores.debug();

		// console.error(`${bestPos.x} ${bestPos.y}, elem: ${grid.get(bestPos)}, score: ${bestScore}`);

		return bestPos;
	}

	playNextMove() {
		const { pacs, pellets } = this.gameState;
		const alivePacs = pacs.filter(pac => !pac.isDead);

		let output = '';
		for (let i = 0; i < alivePacs.length; i++) {
			const pac = alivePacs[i];
			if (pac.isDead) continue;

			console.error(`FUCKER ${pac.id}: ${pac.isDead}`);

			const pos = this.getBestMove(pac);

			output += (`MOVE ${pac.id} ${pos.x} ${pos.y}`);
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
