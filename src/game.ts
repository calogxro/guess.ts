import readline = require('readline');

const _ = {
    random: (array: string | any[]) => array[Math.floor(Math.random() * array.length)],
    range: (n: number) => Array(n).fill(0).map((x, i) => i)
}

class Game {
    playerId: string;
    utility: number;
    choices: { X: number; O: number; };
    actions: number[];
    numberToGuess: number;

    constructor(faces: number) {
        this.playerId = 'X';
        this.utility = 0;
        this.choices = { X: null, O: null };
        this.actions = _.range(faces).map(i => i+1);
        this.numberToGuess = _.random(this.actions);
    }

    private nextPlayer() {
        return this.playerId === 'X' ? 'O' : 'X';
    }

    terminalTest() {
        return this.choices['X'] !== null && this.choices['O'] !== null;
    }

    apply(action: number) {
        if ( ! this.terminalTest() && this.actions.includes(action)) {
            this.choices[this.playerId] = action;
            this.playerId = this.nextPlayer();
            if (this.terminalTest()) {
                if (this.choices['X'] === this.numberToGuess) {
                    this.utility += 1;
                }   
                if (this.choices['O'] === this.numberToGuess) {
                    this.utility += -1;
                }
            }    
        }
    }
}

class View {
    render(state: Game) {
        if (state.choices['X'] !== null || state.choices['O'] !== null) {
            const playerId = state.playerId === 'X' ? 'O' : 'X';
            console.log(playerId, 'plays', state.choices[playerId]);
        }
    }

    onGameOver(state: Game) {
        console.log();
        console.log(state.numberToGuess, 'was the number to guess', '\n');
        
        if (state.utility === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'IT\'S A TIE');
        } 
        else {
            console.log('\x1b[33m%s\x1b[0m', state.utility === 1 ? 'X' : 'O', 'WINS');
        }
    }
}

class ActionController {
    private promptMessage: string;
    
    constructor(promptMessage = '> ') {
        this.promptMessage = promptMessage + ': ';
    }
    
    prompt(onAction: (action: any) => void) {
        let rl = readline.createInterface(process.stdin, process.stdout);
        rl.question(this.promptMessage, (action) => {
            onAction(parseInt(action));
            rl.close();
        });
    }
}

interface PlayerStrategy {
    makeDecision(game: Game, onAction: (action: any) => void): void;
}

class RandomDecision implements PlayerStrategy {
    makeDecision(game: Game, onAction: (action: any) => void) {
        const action = _.random(game.actions);
        onAction(action);
    }
}

abstract class Player {
    id: string;
    private gameController: GameController;

    constructor(id: string) {
        this.id = id;
    }

    abstract takeTurn(game: Game): void;

    abstract onGameOver(): void;

    setGameController(gameController: GameController) {
        this.gameController = gameController;
    }

    onAction(action) {
        this.gameController.onAction(action);
    }
}

class AIPlayer extends Player {
    private strategy: PlayerStrategy;

    constructor(id: string, strategy: PlayerStrategy) {
        super(id);
        this.strategy = strategy;
    }

    takeTurn(game: Game) {
        this.strategy.makeDecision(game, this.onAction.bind(this));
    }

    onGameOver() {
    }
}

class HumanPlayer extends Player {
    private actionController: ActionController;

    constructor(id: string, actionController: ActionController) {
        super(id);
        this.actionController = actionController;
    }

    takeTurn(game: Game) {
        this.actionController.prompt(this.onAction.bind(this));
    }

    onGameOver() {
    }
}

class GameController {
    private game: Game;
    private players: Map<string, Player>;
    private view: View;

    constructor(game: Game, players: Map<string, Player>, view: View) {
        this.game = game;
        this.players = players;
        this.view = view;

        players.forEach((player) => { 
            player.setGameController(this); 
        });
    }

    start() {
        this.onStateChanged();
    }

    onAction(action) {
        this.game.apply(action);
        this.onStateChanged();
    }

    private onStateChanged() {
        this.view.render(this.game);
        this.loop();
    }

    private loop() {
        if ( ! this.game.terminalTest()) {
            const player = this.players.get(this.game.playerId);
            
            player.takeTurn(this.game);
        }
        else {
            this.players.forEach((player) => {
                player.onGameOver();
            });
    
            this.view.onGameOver(this.game);
        }
    }
}

function start(p0: Player, p1: Player, faces: number) {
    const game = new Game(faces);
    const view = new View();

    const players = new Map<string, Player>([
        [p0.id, p0], 
        [p1.id, p1]
    ]);

    const gameController = new GameController(game, players, view);

    gameController.start();
}

const faces = 6;

const p0 = new HumanPlayer('X', new ActionController(`Guess a number from 1-${faces}`));
//const p0 = new AIPlayer('X', new RandomDecision());
const p1 = new AIPlayer('O', new RandomDecision());

start(p0, p1, faces);