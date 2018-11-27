const _ = {
    random: array => array[Math.floor(Math.random() * array.length)],
    range: n => Array(n).fill(0).map((x, i) => i)
}

class Game {
    constructor(faces) {
        this.player = 'X'
        this.utility = 0
        this.numbers = {
            'X': null,
            'O': null
        }
        this._actions = _.range(faces).map(i => i+1)
        this.numberToGuess = _.random( this.actions())
    }

    actions() {
        return this._actions
    }

    apply(action) {
        if ( ! this.terminalTest()) {
            
            const actions = this.actions()

            if (actions.includes(action)) {

                this.numbers[this.player] = action

                this.player = this.player === 'X' ? 'O' : 'X'

                if (this.terminalTest()) {
                    if (this.numbers['X'] === this.numberToGuess) {
                        this.utility += 1
                    }
                    
                    if (this.numbers['O'] === this.numberToGuess) {
                        this.utility += -1
                    }
                }
            }
        }
    }

    terminalTest() {
        return this.numbers['X'] !== null && this.numbers['O'] !== null
    }
}

class View {
    render(state) {
        if (state.numbers['X'] !== null || state.numbers['O'] !== null) {
            const player = state.player === 'X' ? 'O' : 'X'

            console.log(player, 'plays', state.numbers[player])
        }

        //console.log(state)
    }

    onGameOver(state) {
        console.log()

        console.log(state.numberToGuess, 'was the number to guess')

        console.log()
        
        if (state.utility === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'IT\'S A TIE')
        }
        else {
            console.log('\x1b[33m%s\x1b[0m', state.utility === 1 ? 'X' : 'O', 'WINS')
        }
    }
}

class AbstractPlayer {
    constructor(id) {
        this.id = id
    }

    takeTurn(game) {}

    play(action) {
        this.onPlay(action)
    }

    onPlay(action) {}

    onGameOver() {}
}

class AIPlayer extends AbstractPlayer {
    constructor(id, strategy) {
        super(id)
        this.strategy = strategy
    }

    takeTurn(game) {
        //return this.strategy.makeDecision(game)
        
        this.strategy.makeDecision(game, (action) => {
            this.play(action)
        })
    }
}

class AbstractPlayerStrategy {
    static makeDecision(game) {}
}

class RandomDecision extends AbstractPlayerStrategy {
    static makeDecision(game, onAction) {
        //return _.random( game.actions())
        
        const action = _.random( game.actions())
        onAction(action)
    }
}

class HumanPlayer extends AbstractPlayer {
    constructor(id, inputListener) {
        super(id)
        this.inputListener = inputListener
    }

    takeTurn(game) {
        this.inputListener.onAction((action) => {
            this.play(action)
        })
    }

    onGameOver() {
        this.inputListener.close()
    }
}

class GameController {
    constructor(game, players, view) {
        this.game = game
        this.players = players
        this.view = view
    }

    start() {
        this.onStateChanged()
    }

    onStateChanged() {
        this.view.render(this.game)
        this.loop()
    }

    loop() {
        if ( ! this.game.terminalTest()) {
            const player = this.players.get( this.game.player)

            //this.game.apply( player.play(this.game))

            player.onPlay = (action) => {
                this.game.apply(action)
                this.onStateChanged()
            }

            player.takeTurn(this.game)
        }
        else {
            this.players.forEach((player) => {
                player.onGameOver()
            })
    
            this.view.onGameOver(this.game)
        }
    }
}

class InputListener {
    constructor(promptMessage='') {
        const readline = require('readline')
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: promptMessage + '> '
        })
        
        this.rl.on('line', this.onInput.bind(this))
    }

    onInput(action) {
        this._onAction( parseInt(action))
    }

    onAction(_onAction) {
        this._onAction = _onAction
        this.rl.prompt()
    }

    close() {
        this.rl.close()
    }
}


const faces = 6

const game = new Game(faces)
const view = new View()

const p0 = new HumanPlayer('X', new InputListener('guess a number from 1-'+faces))
//const p0 = new AIPlayer('X', RandomDecision)
const p1 = new AIPlayer('O', RandomDecision)

const players = new Map([
    [p0.id, p0], 
    [p1.id, p1]
])

const gameController = new GameController(game, players, view)

gameController.start()
