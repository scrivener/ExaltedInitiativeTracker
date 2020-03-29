const express = require('express');
const app = express();
//const http = require('http').createServer(app);
const port = 3000;
const fs = require('fs')


var state = JSON.parse(fs.readFileSync('state.json', 'utf-8'))
console.log('Starting state');
console.log(state);
// {
//   'pieces': [
//     {
//       'name': 'Glorious Hammer',
//       'id': 1,
//       'color': '#abcdea',
//       'initiative': 20,
//       'acted': false
//     }
//   ]
// };

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
const io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');

  // Send new users the game state immediately
  socket.emit('update', state);

  // When we receive an update from the client...
  // 1. Update the server's state
  // 2. Broadcast the new state to all clients
  socket.on('update', function(msg) {
    try {
      let newState = msg;
      state = newState
      console.log('JSON.parsed a new state:');
      console.log(newState);
      io.emit('update', state);

      try {
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
