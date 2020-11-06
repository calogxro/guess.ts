"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var readline = require("readline");
var _ = {
    random: function (array) { return array[Math.floor(Math.random() * array.length)]; },
    range: function (n) { return Array(n).fill(0).map(function (x, i) { return i; }); }
};
var Game = /** @class */ (function () {
    function Game(faces) {
        this.player = 'X';
        this.utility = 0;
        this.choices = { X: null, O: null };
        this.actions = _.range(faces).map(function (i) { return i + 1; });
        this.numberToGuess = _.random(this.actions);
    }
    Game.prototype.nextPlayer = function () {
        return this.player === 'X' ? 'O' : 'X';
    };
    Game.prototype.terminalTest = function () {
        return this.choices['X'] !== null && this.choices['O'] !== null;
    };
    Game.prototype.apply = function (action) {
        if (!this.terminalTest() && this.actions.includes(action)) {
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
    };
    return Game;
}());
var View = /** @class */ (function () {
    function View() {
    }
    View.prototype.render = function (state) {
        if (state.choices['X'] !== null || state.choices['O'] !== null) {
            var player = state.player === 'X' ? 'O' : 'X';
            console.log(player, 'plays', state.choices[player]);
        }
    };
    View.prototype.onGameOver = function (state) {
        console.log();
        console.log(state.numberToGuess, 'was the number to guess', '\n');
        if (state.utility === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'IT\'S A TIE');
        }
        else {
            console.log('\x1b[33m%s\x1b[0m', state.utility === 1 ? 'X' : 'O', 'WINS');
        }
    };
    return View;
}());
var Player = /** @class */ (function () {
    function Player(id) {
        this.id = id;
    }
    Player.prototype.onAction = function (action) {
        this.gameController.onAction(action);
    };
    return Player;
}());
var AIPlayer = /** @class */ (function (_super) {
    __extends(AIPlayer, _super);
    function AIPlayer(id, strategy) {
        var _this = _super.call(this, id) || this;
        _this.strategy = strategy;
        return _this;
    }
    AIPlayer.prototype.takeTurn = function (game) {
        this.strategy.makeDecision(game, this.onAction.bind(this));
    };
    AIPlayer.prototype.onGameOver = function () {
    };
    return AIPlayer;
}(Player));
var HumanPlayer = /** @class */ (function (_super) {
    __extends(HumanPlayer, _super);
    function HumanPlayer(id, actionController) {
        var _this = _super.call(this, id) || this;
        _this.actionController = actionController;
        return _this;
    }
    HumanPlayer.prototype.takeTurn = function (game) {
        this.actionController.prompt(this.onAction.bind(this));
    };
    HumanPlayer.prototype.onGameOver = function () {
    };
    return HumanPlayer;
}(Player));
var RandomDecision = /** @class */ (function () {
    function RandomDecision() {
    }
    RandomDecision.prototype.makeDecision = function (game, onAction) {
        var action = _.random(game.actions);
        onAction(action);
    };
    return RandomDecision;
}());
var GameController = /** @class */ (function () {
    function GameController(game, players, view) {
        this.game = game;
        this.players = players;
        this.view = view;
    }
    GameController.prototype.start = function () {
        this.onStateChanged();
    };
    GameController.prototype.onAction = function (action) {
        this.game.apply(action);
        this.onStateChanged();
    };
    GameController.prototype.onStateChanged = function () {
        this.view.render(this.game);
        this.loop();
    };
    GameController.prototype.loop = function () {
        if (!this.game.terminalTest()) {
            var player = this.players.get(this.game.player);
            player.takeTurn(this.game);
        }
        else {
            this.players.forEach(function (player) {
                player.onGameOver();
            });
            this.view.onGameOver(this.game);
        }
    };
    return GameController;
}());
var ActionController = /** @class */ (function () {
    function ActionController(promptMessage) {
        if (promptMessage === void 0) { promptMessage = '>'; }
        this.promptMessage = promptMessage + '>';
    }
    ActionController.prototype.prompt = function (onAction) {
        var rl = readline.createInterface(process.stdin, process.stdout);
        rl.question(this.promptMessage, function (action) {
            onAction(parseInt(action));
            rl.close();
        });
    };
    return ActionController;
}());
var faces = 6;
var game = new Game(faces);
var view = new View();
var p0 = new HumanPlayer('X', new ActionController('guess a number from 1-' + faces));
//const p0 = new AIPlayer('X', new RandomDecision());
var p1 = new AIPlayer('O', new RandomDecision());
var players = new Map([
    [p0.id, p0],
    [p1.id, p1]
]);
var gameController = new GameController(game, players, view);
players.forEach(function (player) {
    player.gameController = gameController;
});
gameController.start();
