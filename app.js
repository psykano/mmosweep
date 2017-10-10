const { Game } = require('./game');

function printError(message) {
  console.log('Error: ' + message);
}

function drawMessage(message) {
  process.stdout.write(message);
}

game = new Game();
game.errorLogger = printError;
game.drawLogger = drawMessage;

// Testing
game.newGame('easy');

game.clickCell(0);
game.printBoard();
console.log(game.lastRevealedCells);
console.log('--------------');
console.log(game.allRevealedCells);

game.clickCell(1);
game.printBoard();
console.log(game.lastRevealedCells);
console.log('--------------');
console.log(game.allRevealedCells);
