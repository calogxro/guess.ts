import readline = require('readline');

const _ = {
    random: (array: string | any[]) => array[Math.floor(Math.random() * array.length)],
    range: (n: number) => Array(n).fill(0).map((x, i) => i)
}

class Game {
    player: string;
    utility: number;
    choices: { X: number; O: number; };
    actions: number[];
    numberToGuess: number;

    constructor(faces: number) {
        this.player = 'X';
        this.utility = 0;
        this.choices = { X: null, O: null };
        this.actions = _.range(faces).map(i => i+1);
        this.numberToGuess = _.random(this.actions);
    }

    private nextPlayer() {
        return this.player === 'X' ? 'O' : 'X';
    }

    terminalTest() {
        return this.choices['X'] !== null && this.choices['O'] !== null;
    }

    apply(action: number) {
        if ( ! this.terminalTest() && this.actions.includes(action)) {
            this.choices[this.player] = action;
            this.player = this.nextPlayer();
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
            const player = state.player === 'X' ? 'O' : 'X';
            console.log(player, 'plays', state.choices[player]);
        }
    }

    onGameOver(state: Game) {
        console.log();
        console.log(state.numberToGuess, 'was the number to guess', '\n');
        
        if (state.utility === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'IT\'S A TIE');
        } else {
            console.log('\x1b[33m%s\x1b[0m', state.utility === 1 ? 'X' : 'O', 'WINS');
        }
    }
}

abstract class Player {
    id: string;
    gameController: GameController;

    constructor(id: string) {
        this.id = id;
    }

    abstract takeTurn(game: Game): void;

    abstract onGameOver(): void;

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
    actionController: ActionController;

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

interface PlayerStrategy {
    makeDecision(game: Game, onAction: (action: any) => void): void;
}

class RandomDecision implements PlayerStrategy {
    makeDecision(game: Game, onAction: (action: any) => void) {
        const action = _.random(game.actions);
        onAction(action);
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
            const player = this.players.get(this.game.player);
            
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

class ActionController {
    private promptMessage: string;
    
    constructor(promptMessage = '>') {
        this.promptMessage = promptMessage + '>';
    }
    
    prompt(onAction: (action: any) => void) {
        let rl = readline.createInterface(process.stdin, process.stdout);
        rl.question(this.promptMessage, (action) => {
            onAction(parseInt(action));
            rl.close();
        });
    }
}


const faces = 6;

const game = new Game(faces);
const view = new View();

const p0 = new HumanPlayer('X', new ActionController('guess a number from 1-'+faces));
//const p0 = new AIPlayer('X', new RandomDecision());
const p1 = new AIPlayer('O', new RandomDecision());

const players = new Map<string, Player>([
    [p0.id, p0], 
    [p1.id, p1]
]);

const gameController = new GameController(game, players, view);

players.forEach((player) => { 
    player.gameController = gameController; 
});

gameController.start();
