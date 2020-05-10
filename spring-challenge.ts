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

	isEqual(pos: Position) {
		return this.x === pos.x && this.y === pos.y;
	}
};

class Pac {
	id: number;
	pos: Position;
	typeId: string;
	speedTurnsLeft: number;
	abilityCooldown: number;
	isDead: boolean;
	target: { pos: Position, score: number };

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

	getNeighbours(pos: Position) {
		const neighbours: Position[] = [];
		let tPos: Position, bPos: Position, rPos: Position, lPos: Position;

		if (pos.x === 0) lPos = new Position(this.width - 1, pos.y);
		else lPos = new Position(pos.x - 1, pos.y);

		if (pos.x === this.width - 1) rPos = new Position(0, pos.y);
		else rPos = new Position(pos.x + 1, pos.y);

		if (pos.y === 0) tPos = new Position(pos.x, this.height - 1);
		else tPos = new Position(pos.x, pos.y - 1);

		if (pos.y === this.height - 1) bPos = new Position(pos.x, 0);
		else bPos = new Position(pos.x, pos.y + 1);

		neighbours.push(tPos, bPos, lPos, rPos);
		return neighbours;
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
					this.universalGrid.set(new Position(x, y), -10);
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
			this.universalGrid.set(new Position(pacInfo.x, pacInfo.y), -2);
		});

		const updateDeadStatus = (pacArray: Array<Pac>, pacInput: any[]) => {
			if (pacArray.length === pacInput.length) return;
			pacArray.forEach(pac => {
				const found = pacInput.filter(p => p.pacId === pac.id).length > 0;
				if (!found) {
					pac.isDead = true;
					// console.error(`${pac.id} not found in input, turning dead.`);
				}
			});
		};

		updateDeadStatus(this.pacs, pacInput.filter(p => p.mine));
		// updateDeadStatus(this.enemies, pacInput);

		this.pellets = pelletInput.map(p => new Pellet(new Position(p.x, p.y), p.value));

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

interface GameAction {
	type: 'MOVE' | 'SWITCH' | 'SPEED';
	into?: 'ROCK' | 'PAPER' | 'SCISSORS';
	pos?: Position;
};
class Solution {

	gameAi: GameAI;

	constructor(gameAi: GameAI) {
		this.gameAi = gameAi;
	}

	private getPossibleActionsForPac(pac: Pac) {
		const { pellets } = this.gameAi.gameState;

		const actions: GameAction[] = [];
		if (!pac.abilityCooldown) {
			actions.push({ type: 'SPEED' });
			actions.push({ type: 'SWITCH', into: 'ROCK' });
			actions.push({ type: 'SWITCH', into: 'PAPER' });
			actions.push({ type: 'SWITCH', into: 'SCISSORS' });
		}

		for (let i = 0; i < Math.min(pellets.length, 5); i++) {
			const index = Math.floor(Math.random() * pellets.length);
			actions.push({ type: 'MOVE', pos: pellets[index].pos });
		}

		return actions;
	}

	private generateMoves() {
		const { pacs } = this.gameAi.gameState;
		const alivePacs = pacs.filter(pac => !pac.isDead);
		for (let i = 0; i < pacs.length; i++) {
			const pac = pacs[i];
			const actions = this.getPossibleActionsForPac(pac);
			console.error(actions);
		}
	}

	private applyMovesAndEvalutate() {
	
	}

	randomizeAndEvaluate() {
		this.generateMoves();
	}
}

class GameAI {
	gameState: GameState;

	constructor(gameState: GameState) {
		this.gameState = gameState;
	}

	initPacTarget(pac: Pac, gridCopy: Grid<string>) {
		const { universalGrid } = this.gameState;
		const grid = gridCopy;
		const scores = new Grid<number>(grid.width, grid.height, -Infinity);
		const distances = new Grid<number>(grid.width, grid.height, Infinity);
		const visited = new Grid<boolean>(grid.width, grid.height, false);

		const setScore = (pos: Position, value: number) => {
			if (value > scores.get(pos)) {
				scores.set(pos, value);
			}
		};
		
		const setDistance = (pos: Position, value: number) => {
			// if (value > distances.get(pos)) {
				distances.set(pos, value);
			// }
		};

		const BFS = (initialPos: Position) => {
			let Q: { pos: Position, score: number, distance: number }[] = [];
			Q.push({ pos: new Position(initialPos.x, initialPos.y), score: 0, distance: 0 });

			while (Q.length) {
				let size = Q.length;
				while (size--) {
					const { pos, score, distance } = Q.shift();

					if (visited.get(pos)) continue;
					if (grid.get(pos) === Entities.WALL) continue;

					const neighbours = grid.getNeighbours(pos);

					// TODO: think more on this: adding -1 as a cost to walk
					let newVal: number = score + universalGrid.get(pos);
					setScore(pos, newVal);
					setDistance(pos, distance);

					for (const neighbour of neighbours) {
						Q.push({ pos: neighbour, score: newVal, distance: distance + 1 });
					}

					visited.set(pos, true);
				}
			};
		};

		BFS(pac.pos);


		const moves: { score: number, pos: Position }[] = [];
		// let bestScore: number = -1000, bestPos: Position = pac.pos;
		for (let y = 0; y < grid.height; y++) {
			for (let x = 0; x < grid.width; x++) {
				const pos = new Position(x, y);
				let distance = distances.get(pos), profit = scores.get(pos);
				const score = profit - (distance * 0.3);
				moves.push({ score, pos });
			}
		}

		const sortedMoves = moves.sort((m1, m2) => {
			return m1.score > m2.score ? -1 : 1;
		}).slice(0, 3);

		const randIndex = 0; //Math.floor(Math.random() * sortedMoves.length);
		const bestMove = sortedMoves[randIndex];

		universalGrid.debug();
		distances.debug();
		scores.debug();

		if (!pac.target) pac.target = { score: bestMove.score, pos: bestMove.pos };
		else if (bestMove.score - pac.target.score > 5) {
			pac.target = { score: bestMove.score, pos: bestMove.pos };
		}
	}

	playNextMove() {
		const { pacs, pellets } = this.gameState;
		const alivePacs = pacs.filter(pac => !pac.isDead);

		// reset targets if already reached
		alivePacs.forEach(pac => {
			if (pac.target && pac.pos.isEqual(pac.target.pos)) {
				pac.target = null;
			}
		});

		const gridCopy = this.gameState.grid.copy();

		let output = '';
		for (let i = 0; i < alivePacs.length; i++) {
			const pac = alivePacs[i];
			if (pac.isDead) continue;

			this.initPacTarget(pac, gridCopy);
			console.error(`${pac.id}: ${pac.target.pos.x} ${pac.target.pos.y}`);
			output += (`MOVE ${pac.id} ${pac.target.pos.x} ${pac.target.pos.y}`);
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
		// const sol = new Solution(gameAI);
		// sol.randomizeAndEvaluate();
	}

}

RunGame();
