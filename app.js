const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { Game } = require('./game');

const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');
const logging = true;

app.use(express.static(publicPath));

app.get('/', function(req, res){
  const file = path.join(publicPath, 'index.html');
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

function logSocketIo(message) {
  console.log('SocketIO - ' + message);
}

const socketIoLogger = logSocketIo;
// To disable socket.io logging
//const socketIoLogger = () => {};

function outOfTime() {
  socketIoLogger('time over');
  io.emit('stime', game.endTime);
  io.emit('tlost');
}

game.outOfTimeCb = outOfTime;

io.on('connection', (socket) => {
  socketIoLogger('a user connected: ' + socket.id);

  socket.on('disconnect', (reason) => {
    socketIoLogger('user disconnected: ' + socket.id);
  });

  if (game.isInProgress()) {
    io.emit('start', game.board.width + ' ' + game.board.size);
    const serializedRevealedCells = game.board.allRevealedCells.map((cell) => {
      return cell.serialize();
    });
    io.emit('update', JSON.stringify(serializedRevealedCells));
    if (game.startTime > 0) {
      io.emit('time', game.currentTime);
    }
  }

  socket.on('new', (data) => {
    socketIoLogger('on new: ' + data);
    if (game.newGame(data)) {
      io.emit('start', game.board.width + ' ' + game.board.size);
    }
  });

  socket.on('cell', (data) => {
    socketIoLogger('on cell: ' + data);
    const num = parseInt(data);
    if (game.clickCell(num)) {
      io.emit('time', game.currentTime);

      const serializedRevealedCells = game.board.lastRevealedCells.map((cell) => {
        return cell.serialize();
      });
      io.emit('update', JSON.stringify(serializedRevealedCells));

      if (game.isWon()) {
        game.winnerId = socket.id;
        socketIoLogger('game won: ' + game.winnerId);
        io.emit('stime', game.endTime);
        io.emit('won');
        socket.emit('name');
      } else if (game.isLost()) {
        socketIoLogger('game lost');
        io.emit('stime', game.endTime);
        io.emit('lost');
      }

      game.printBoard();
    }
  });

  socket.on('name', (data) => {
    socketIoLogger('on name: ' + data);
    if (game.isWaiting() && game.isWon() && game.winnerId === socket.id) {
      game.doneWaitingForWinner();
      name = data.replace(/[^0-9a-z]/gi, '').substring(0, 2);
      socketIoLogger('name submitted: ' + name); //removeme
      socketIoLogger('...for time: ' + game.endTime); //removeme
      // TODO submit name to highscore in db
    }
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
