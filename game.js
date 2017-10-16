const { Board } = require('./board');

const EndOfLine = require('os').EOL;

const GameState = {
  INIT: 'INIT',
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  LOST: 'LOST'
};

const OutOfTime = 999000;
const winnerTimeoutMs = 10000;

class Game {
  constructor() {
    this._board = new Board();
    this._state = GameState.INIT;
    this._errorLogger = () => {};
    this._drawLogger = () => {};
    this._startTime = 0;
    this._endTime = 0;
    this._outOfTimeCb = () => {};
    this._outOfTimeInterval = 0;
    this._waiting = false;
    this._winnerId = 0;
    this._winnerTimeout = 0;
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

  set outOfTimeCb(cb) {
    this._outOfTimeCb = cb;
  }

  set winnerId(id) {
    this._winnerId = id;
  }

  get winnerId() {
    return this._winnerId;
  }

  newGame(difficulty) {
    if (this._waiting || this.isInProgress()) {
      this._errorLog('unable to start game: current game waiting/in progress');
      return false;
    }

  	if (difficulty === 'veryeasy') {
  	  this._board.init(4, 4, 4);
    } else if (difficulty === 'easy') {
      this._board.init(8, 8, 10);
    } else if (difficulty === 'normal') {
      this._board.init(16, 16, 40);
    } else if (difficulty === 'hard') {
      this._board.init(30, 16, 99);
    } else {
      this._errorLog('invalid difficulty');
      return false;
    }

    this._startTime = 0;
    this._endTime = 0;
    this._state = GameState.NEW;
    return true;
  }

  _gameOver(state) {
    clearInterval(this._outOfTimeInterval);
    this._endTime = (new Date).getTime();
    this._state = state;
  }

  clickCell(index) {
    if (this._waiting) {
      this._errorLog('unable to click: current game waiting');
      return false;
    }

    if (index < 0 || index >= this._board.size) {
      this._errorLog('unable to click: index out of bounds');
      return false;
    }

    if (this._state === GameState.NEW) {
      this._startTime = (new Date).getTime();
      this._board.generate(index);
      this._board.revealCell(index);

      this._outOfTimeInterval = setInterval(() => {
        if (this.currentTime > OutOfTime) {
          this._gameOver(GameState.LOST);
          this._outOfTimeCb();
        }
      }, 1000);

      this._state = GameState.IN_PROGRESS;
      return true;
    } else if (this._state === GameState.IN_PROGRESS) {
      if (!this._board.getCell(index).isRevealed()) {
        this._board.revealCell(index);
        if (this._board.getCell(index).type === 'bomb') {
          this._gameOver(GameState.LOST);
        } else if (this._board.allRevealedCells.length ===
          this._board.size - this._board.bombs) {
          this._gameOver(GameState.WON);
          this._waiting = true;
          this._winnerTimeout = setTimeout(() => {
            this._waiting = false;
          }, winnerTimeoutMs);
        }
        return true;
      }
    } else {
      this._errorLog('unable to click cell in current game state');
    }
    return false;
  }

  get board() {
    return this._board;
  }

  get startTime() {
    return this._startTime;
  }

  get currentTime() {
    return (new Date).getTime() - this._startTime;
  }

  get endTime() {
    return this._endTime - this._startTime;
  }

  isInProgress() {
    if (this._state === GameState.NEW ||
      this._state === GameState.IN_PROGRESS) {
      return true;
    }
    return false;
  }

  isWaiting() {
    if (this._waiting) {
      return true;
    }
    return false;
  }

  doneWaitingForWinner() {
    this._waiting = false;
    clearTimeout(this._winnerTimeout);
  }

  isWon() {
    if (this._state === GameState.WON) {
      return true;
    }
    return false;
  }

  isLost() {
    if (this._state === GameState.LOST) {
      return true;
    }
    return false;
  }

  printBoard() {
    switch(this._state) {
      case GameState.NEW:
      case GameState.IN_PROGRESS:
      case GameState.WON:
      case GameState.LOST:
        for (let i = 0; i < this._board.size; ++i) {
          if (i % this._board.width === 0) {
            this._drawLog(EndOfLine);
          }
          if (this._board.getCell(i) && this._board.getCell(i).isRevealed()) {
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
