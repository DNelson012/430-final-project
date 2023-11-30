
const http = require('http');
const { Server } = require('socket.io');
const { Lobby } = require('./models');

let io;

// Helpers
// https://stackoverflow.com/questions/23187013/is-there-a-better-way-to-sanitize-input-with-javascript
const sanitizeString = (inStr) => {
  let str = inStr
  str = str.replace(/[^a-z0-9áéíóúñü .,_-]/gim, "");
  return str.trim();
  // If this is taking in URLs, 
  // I can do this on individual segments between '/' characters
  //  And also discard anything past '?' on the last segment
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeID(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const clearSession = (socket) => {
  const session = socket.request.session;
  if (session.name) { delete session.name; }
  if (session.lobbyID) { delete session.lobbyID; }
}

// Leave every lobby, if the user is in any
//  A bit of a nuclear approach, but it should work fine
const leaveAllRooms = (socket) => {
  socket.rooms.forEach(room => {
    if (room === socket.id) return; // Ignore the socket ID
    socket.leave(room);

    // This is definitely not needed, but for the sake of being thorough
    clearSession(socket);
  });
}

// Call a function only for members of a given lobby
const doForLobby = (socket, func) => {
  // If there are no rooms, it says zero
  //  This is bad when I want that id room
  //  So this calls it immediately if the id is the only room
  if (socket.rooms.size === 0) { func(); }
  socket.rooms.forEach(room => {
    if (room === socket.id) return;

    func()
  });
}



// const updatePlayerList = (socket, data) => {

// }

// Join the given lobby
const handleJoinLobby = async (socket, data) => {
  leaveAllRooms(socket);
  socket.join(data.lobbyID);

  let doc;
  try {
    Lobby.updateOne({ lobbyID: data.lobbyID }, { $inc: { userCount: 1 } }).exec();
    doc = await Lobby.findOne({ lobbyID: data.lobbyID })
      .select('lobbyID host userCount numRounds').lean().exec();
  } catch (err) {
    console.log(err);
  }

  // If it didn't work, quit early
  if (!doc) { 
    io.to(socket.id).emit('user join', {
      err: true,
      text: `Failed to join lobby.`
    });
    return;
  }

  // Add data to the session
  const session = socket.request.session;
  const name = sanitizeString(data.name);
  session.name = name;
  session.lobbyID = data.lobbyID;

  // Tell everyone in the lobby that someone joined
  doForLobby(socket,
    () => {
      io.to(data.lobbyID).emit('user join', {
        lobbyID: data.lobbyID,
        host: doc.host === socket.id,
        userCount: doc.userCount,
        numRounds: doc.numRounds,
        text: `${name} joined the lobby.`
      });
    });
};

// Create & Join the given lobby
const handleCreateLobby = async (socket, data) => {
  const lobbyID = makeID(5);

  const lobbyData = {
    lobbyID: lobbyID,
    host: socket.id,
    numRounds: data.numRounds,
  };

  try {
    const newLobby = new Lobby(lobbyData);
    await newLobby.save();
  } catch (err) {
    console.log(err);
    return;
  }

  // Join the newly created lobby
  handleJoinLobby(socket, { lobbyID: lobbyID, name: data.name });
};

const handleLeaveLobby = async (socket) => {
  // Get the display name and lobby
  const session = socket.request.session;
  const name = session.name;
  const lobby = session.lobbyID;

  // If there is no lobby, don't do anything else
  if (!lobby) { return; }

  // Delete the lobby (only happens when host leaves)
  let doc = await Lobby.findOne({ lobbyID: lobby })
    .select('host').lean().exec();
  if (doc.host === socket.id) {
    doc = await Lobby.deleteOne({ lobbyID: lobby }).lean().exec();
    if ( doc.acknowledged && doc.deletedCount) {
      console.log('Lobby deleted');
    }
    else {
      console.log('Failed to delete lobby');
    }
  }

  // Remove the session data
  clearSession(socket);

  // Tell everyone in the lobby that someone left
  doForLobby(socket,
    () => {
      io.to(lobby).emit('user leave', { lobbyID: lobby, text: `${name} left the lobby.` });
    });

  // Actually leave the room
  leaveAllRooms(socket);
}


// Initial set up for the server to handle socket connections
const socketSetup = (app, sessionMiddleware) => {
  const server = http.createServer(app);
  io = new Server(server);

  // ### Express-Socket integration
  io.engine.use(sessionMiddleware);

  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
      console.log('a user disconnected');
    });

    socket.on('create lobby', (data) => handleCreateLobby(socket, data));
    socket.on('join lobby', (data) => handleJoinLobby(socket, data));
    socket.on('leave lobby', () => handleLeaveLobby(socket));
    socket.on('disconnecting', () => handleLeaveLobby(socket));
  });

  return server;
};

module.exports = socketSetup;