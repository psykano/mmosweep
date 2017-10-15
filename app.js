const path = require('path');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { Game } = require('./game');

const port = process.env.PORT || 3000;
const publicPath = __dirname + '/public';
const logging = true;
const winnerTimeoutMs = 10000;

app.get('/', function(req, res){
  const file = path.normalize(publicPath + '/index.html');
  res.sendFile(file);
});

function printGameError(message) {
  console.log('Error: ' + message);
}

function drawGame(message) {
  process.stdout.write(message);
}

game = new Game();
game.errorLogger = printGameError;
game.drawLogger = drawGame;

let waiting = false;
let winnerSocketId = 0;
let winnerTimeout = 0;

function logSocketIo(message) {
  console.log('SocketIO - ' + message);
}

const socketIoLogger = logSocketIo;
// To disable socket.io logging
//const socketIoLogger = () => {};

io.on('connection', (socket) => {
  socketIoLogger('a user connected: ' + socket.id);
  socket.on('disconnect', function(){
    socketIoLogger('user disconnected: ' + socket.id);
  });

  if (game.isInProgress()) {
    io.emit('start', game.board.width + ' ' + game.board.size);
    const serializedRevealedCells = game.board.allRevealedCells.map((cell) => {
      return cell.serialize();
    });
    io.emit('update', JSON.stringify(serializedRevealedCells));
  }

  socket.on('new', (data) => {
    socketIoLogger('on new: ' + data);
    if (waiting) return;
    if (!game.isInProgress()) {
      let difficulty = '';
      if (data === 'easy') {
        difficulty = 'easy';
      } else if (data === 'normal') {
        difficulty = 'normal';
      } else if (data === 'hard') {
        difficulty = 'hard';
      }

      if (difficulty) {
        game.newGame(difficulty);
        io.emit('start', game.board.width + ' ' + game.board.size);
      }
    }
  });

  socket.on('cell', (data) => {
    socketIoLogger('on cell: ' + data);
    if (waiting) return;
    const num = parseInt(data);
    if (num >= 0 && num < game.board.size) {
      if (game.clickCell(num)) {
        const serializedRevealedCells = game.board.lastRevealedCells.map((cell) => {
          return cell.serialize();
        });
        io.emit('update', JSON.stringify(serializedRevealedCells));

        if (game.isWon()) {
          waiting = true;
          winnerSocketId = socket.id;
          socketIoLogger('game won: ' + winnerSocketId);
          io.emit('won');
          socket.emit('name');
          winnerTimeout = setTimeout(function() {
            waiting = false;
          }, winnerTimeoutMs);
        } else if (game.isLost()) {
          socketIoLogger('game lost');
          io.emit('lost');
        }

        game.printBoard();
      }
    }
  });

  socket.on('name', (data) => {
    socketIoLogger('on name: ' + data);
    if (!waiting) return;
    if (game.isWon() && winnerSocketId === socket.id) {
      waiting = false;
      clearTimeout(winnerTimeout);
      name = data.replace(/[^0-9a-z]/gi, '').substring(0, 2);
      socketIoLogger('name submitted: ' + name); //removeme
      // TODO submit name to highscore in db
    }
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
