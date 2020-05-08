# Algorithm

## Initialisation

- Create universal state grid and initialise it with following rules:

	- super peddles: 10
	- unexplored peddles: 1
	- explored peddles: 2
	- empty: 0

## On each turn:

- Update universal grid based on visibility (inputs)
- For each own Pac:

	- If `speed` ability available, use it
	- Run BFS from current pos in universal grid and find most profitable path in unexplored grid
		- <strike>BFS should consider rounded corners</strike> [FUTURE]
	- Move command to end of the path

## Ideas
- Fight with enemy, stop a turn and wait for enemy to come near and then stateful attack.
- Consider finishing off pellets in unexplored corners first.