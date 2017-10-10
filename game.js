const { Board } = require('./board');

var EndOfLine = require('os').EOL;

var GameState = {
  INIT: 'INIT',
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  END: 'END'
};

class Game {
  constructor() {
    this._board = new Board();
    this._state = GameState.INIT;
    this._allRevealedCells = [];
    this._errorLogger = () => {};
    this._drawLogger = () => {};
  }

  set errorLogger(logger) {
    this._errorLogger = logger;
  }

  _errorLog(message) {
    this._errorLogger(message);
  }

  set drawLogger(logger) {
    this._drawLogger = logger;
  }

  _drawLog(drawMessage) {
    this._drawLogger(drawMessage);
  }

  newGame(difficulty) {
    if (difficulty === 'easy') {
      this._board.init(8, 8, 10);
    } else if (difficulty === 'normal') {
      this._board.init(16, 16, 40);
    } else if (difficulty === 'hard') {
      this._board.init(16, 30, 99);
    } else {
      this._errorLog('invalid difficulty');
      return;
    }

    this._allRevealedCells = [];
    this._state = GameState.NEW;
  }

  clickCell(index) {
    if (this._state === GameState.NEW) {
      this._board.generate(index);
      this._board.revealCell(index);
      this._state = GameState.IN_PROGRESS;
    } else if (this._state === GameState.IN_PROGRESS) {
      this._board.revealCell(index);
      if (this._board.getCell(index).type === 'bomb') {
        this._state = GameState.END;
        // TODO game over stuff
      }
    } else {
      this._errorLog('unable to click cell in current game state');
    }
  }

  get allRevealedCells() {
    return this._allRevealedCells;
  }

  get lastRevealedCells() {
    const cells = this._board.lastRevealedCellIndexes.map((index) => {
      return this._board.getCell(index);
    });
    if (cells.length) {
      this._allRevealedCells.push(cells);
    }
    return cells;
  }

  printBoard() {
    switch(this._state) {
      case GameState.NEW:
      case GameState.IN_PROGRESS:
      case GameState.END:
        for (let i = 0; i < this._board.size; ++i) {
          if (i % this._board.width === 0) {
            this._drawLog(EndOfLine);
          }
          if (this._board.getCell(i) && this._board.getCell(i).isRevealed) {
            if (this._board.getCell(i).type === 'empty') {
              this._drawLog('|_|');
            }
            if (this._board.getCell(i).type === 'bomb') {
              this._drawLog('|b|');
            }
            if (this._board.getCell(i).type === 'number') {
              this._drawLog('|' + this._board.getCell(i).number + '|');
            }
          } else {
            this._drawLog('| |');
          }
        }
        this._drawLog(EndOfLine);
        break;
      default:
        this._errorLog('no game to print');
    }
  }
}

module.exports = { Game }
