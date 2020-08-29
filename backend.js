const express = require('express');
const app = express();
//const http = require('http').createServer(app);
const port = 3001;
const fs = require('fs')

var state;
try {
  state = JSON.parse(fs.readFileSync('state.json', 'utf-8'));
} catch (e) {
  state = {
    'pieces': [],
    'round': 1
  }
}
console.log('Starting state');
console.log(state);

const REQUIRED_FIELDS = {
  id: undefined,
  initiative: 0,
  acted: false,
  name: 'XXX NO NAME XXX',
  color: '#000000',
  peripheralMotes: 0,
  personalMotes: 0,
  wp: 5,
  notes: '',
  mostRecentCrashRecovery: undefined,
  mostRecentCrash: undefined,
  hadActedAtCrash: undefined
}

const fixPiece = (piece) => {
  console.log(`Fixing piece ${piece.name}`)
  Object.keys(REQUIRED_FIELDS).forEach((k, i) => {
    if (!piece.hasOwnProperty(k)) {
      piece[k] = REQUIRED_FIELDS[k]; // Set to default value
      console.log(`Setting field ${k} to ${piece[k]}`)
    }
  });
  Object.keys(piece).forEach((k, i) => {
    if (!REQUIRED_FIELDS.hasOwnProperty(k)) {
      console.log(`Removing field ${k}`)
      delete piece[k];  // Remove fields not in the template
    }
  });
}

const fixGameState = (gameState) => {
  gameState.pieces.forEach((piece, i) => {
    fixPiece(piece);
  });
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
const io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');

  // Send new users the game state immediately
  fixGameState(state);
  socket.emit('update', state);

  // When we receive an update from the client...
  // 1. Update the server's state
  // 2. Broadcast the new state to all clients
  socket.on('update', function(msg) {
    try {
      let newState = msg;
      state = newState
      console.log('Received a new state from a client:');
      console.log(newState);
      fixGameState(state);
      socket.broadcast.emit('update', state);

      try {
        // Write synchronously to prevent weird interleavings of racing
        // requests/file writes that could leave the server memory
        // out of sync with the saved state file, or the saved state
        // file out of sync with the client.
        fs.writeFileSync('state.json', JSON.stringify(state));
        console.log('Successfully wrote');
        console.log(state);
      }
      catch (e) {
        console.error(err);
      }

    } catch (e) {
      console.log(e);
      console.log('Could not JSON.parse this: ' + msg);
    }
  })

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
