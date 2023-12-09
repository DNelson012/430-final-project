const http = require('http');
const { Server } = require('socket.io');
const { Lobby, Image } = require('./models');

let io;

// Helpers
// https://stackoverflow.com/questions/23187013/is-there-a-better-way-to-sanitize-input-with-javascript
const sanitizeString = (inStr) => {
  let str = inStr;
  str = str.replace(/[^a-z0-9áéíóúñü .,_-]/gim, '');
  return str.trim();
  // If this is taking in URLs,
  // I can do this on individual segments between '/' characters
  //  And also discard anything past '?' on the last segment
};

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

// Clears any data that was added to the user's session
const clearSession = (socket) => {
  const { session } = socket.request;
  if (session.name) { delete session.name; }
  if (session.lobbyID) { delete session.lobbyID; }
};

// Leave every lobby, if the user is in any
//  A bit of a nuclear approach, but it should work fine
const leaveAllRooms = (socket) => {
  socket.rooms.forEach((room) => {
    if (room === socket.id) return; // Ignore the socket ID
    socket.leave(room);

    // This is definitely not needed, but for the sake of being thorough
    clearSession(socket);
  });
};

// Call a function only for members of a given lobby
//  Might not actually be that useful
// const doForLobby = (socket, func) => {
//   // If there are no rooms, it says zero
//   //  This is bad when I want that id room
//   //  So this calls it immediately if the id is the only room
//   if (socket.rooms.size === 0) { func(); }
//   socket.rooms.forEach(room => {
//     if (room === socket.id) return;

//     func()
//   });
// }

// Deletes everything related to a lobby from the database
const deleteLobby = async (lobbyID) => {
  try {
    let doc = await Lobby.deleteOne({ lobbyID }).lean().exec();
    if (doc.acknowledged && doc.deletedCount) {
      console.log('Lobby deleted');
    } else {
      console.log('Failed to delete lobby');
    }

    doc = await Image.deleteMany({ lobbyID }).lean().exec();
    if (doc.acknowledged) {
      console.log(`Deleted ${doc.deletedCount} images`);
    } else {
      console.log('Failed to delete lobby');
    }
  } catch (err) {
    console.log(err);
  }
};

// Check to see if the ready number matches the total user number
const checkAllUsersReady = async (lobbyID) => {
  let doc;
  try {
    doc = await Lobby.findOne({ lobbyID })
      .select('userCount usersReady').lean().exec();
  } catch (err) {
    console.log(err);
  }

  return doc.userCount === doc.usersReady;
};

// Lobby setup
const handleJoinLobby = async (socket, data) => {
  leaveAllRooms(socket);
  socket.join(data.lobbyID);

  let doc;
  try {
    await Lobby.updateOne({ lobbyID: data.lobbyID }, { $inc: { userCount: 1 } }).exec();
    doc = await Lobby.findOne({ lobbyID: data.lobbyID })
      .select('lobbyID host userCount numRounds tierOptions').lean().exec();
  } catch (err) {
    console.log(err);
  }

  // If it didn't work, quit early
  if (!doc) {
    io.to(socket.id).emit('user join', {
      err: true,
      text: 'Failed to join lobby.',
    });
    return;
  }

  // Add data to the session
  const { session } = socket.request;
  const name = sanitizeString(data.name);
  session.name = name;
  session.lobbyID = data.lobbyID;

  // Tell everyone in the lobby that someone joined
  io.to(data.lobbyID).emit('user join', {
    lobbyID: data.lobbyID,
    host: doc.host === socket.id,
    userCount: doc.userCount,
    numRounds: doc.numRounds,
    tierOptions: doc.tierOptions,
    text: `${name} joined the lobby.`,
    user: { name, id: socket.id },
  });
};

// Create & Join the given lobby
const handleCreateLobby = async (socket, data) => {
  const lobbyID = makeID(4);

  const lobbyData = {
    lobbyID,
    host: socket.id,
    numRounds: data.numRounds,
    tierOptions: data.tierOptions,
  };

  try {
    const newLobby = new Lobby(lobbyData);
    await newLobby.save();
  } catch (err) {
    console.log(err);
    return;
  }

  // Join the newly created lobby
  handleJoinLobby(socket, { lobbyID, name: data.name });
};

const handleLeaveLobby = async (socket) => {
  // Get the display name and lobby
  const { session } = socket.request;
  const { name } = session;
  const lobby = session.lobbyID;

  // If there is no lobby, don't do anything else
  if (!lobby) { return; }

  // Delete the lobby (only happens when host leaves)
  try {
    const doc = await Lobby.findOne({ lobbyID: lobby }).select('host').lean().exec();
    if (doc && doc.host === socket.id) {
      deleteLobby(lobby);
    }
  } catch (err) {
    console.log(err);
  }

  // Remove the session data
  clearSession(socket);

  // Tell everyone in the lobby that someone left
  io.to(lobby).emit('user leave', { lobbyID: lobby, text: `${name} left the lobby.` });

  // Actually leave the room
  leaveAllRooms(socket);
};

// Game Functions - Start
const handleHostStart = (socket, userArr) => {
  // Get the lobby
  const { session } = socket.request;
  const lobby = session.lobbyID;

  // Tell everyone that the game is starting
  io.to(lobby).emit('game start', userArr);
};

const handleImageSubmit = async (socket, data) => {
  // Get the display name and lobby
  const { session } = socket.request;
  const { name } = session;
  const lobby = session.lobbyID;

  const imageData = {
    lobbyID: lobby,
    ownerID: socket.id,
    ownerName: name,
    image: data.image,
    tier: data.tier,
  };

  try {
    const newImage = new Image(imageData);
    await newImage.save();
  } catch (err) {
    console.log(err);
    return;
  }

  io.to(socket.id).emit('image received');
};

const handleNextRound = async (socket) => {
  // Get the lobby
  const { session } = socket.request;
  const lobby = session.lobbyID;

  // https://stackoverflow.com/questions/2824157/how-can-i-get-a-random-record-from-mongodb
  let doc;
  try {
    doc = await Image.aggregate([{ $match: { lobbyID: lobby } }, { $sample: { size: 1 } }]).exec();
  } catch (err) {
    console.log(err);
  }

  await io.to(lobby).emit('next round', {
    ownerID: doc[0].ownerID,
    ownerName: doc[0].ownerName,
    image: doc[0].image,
    tier: doc[0].tier,
  });

  try {
    await Image.deleteOne({ _id: doc[0]._id }).lean().exec();
  } catch (err) {
    console.log(err);
  }
};

const handleImagesFinished = async (socket) => {
  // Get the lobby
  const { session } = socket.request;
  const lobby = session.lobbyID;

  try {
    await Lobby.updateOne({ lobbyID: lobby }, { $inc: { usersReady: 1 } }).exec();
  } catch (err) {
    console.log(err);
  }

  const ready = await checkAllUsersReady(lobby);
  // If all players have finished, start the game rounds
  if (ready) {
    Lobby.updateOne({ lobbyID: lobby }, { usersReady: 0 }).exec();
    await io.to(lobby).emit('rounds ready');
    handleNextRound(socket);
  }
};

const handleGuessGiven = async (socket, tier) => {
  // Get the lobby
  const { session } = socket.request;
  const lobby = session.lobbyID;

  try {
    await Lobby.updateOne({ lobby }, { $inc: { usersReady: 1 } }).exec();
  } catch (err) {
    console.log(err);
  }

  io.to(lobby).emit('guess made', { id: socket.id, guess: tier });

  // If all players have guessed, go to the next phase
  if (checkAllUsersReady(lobby)) {
    Lobby.updateOne({ lobbyID: lobby }, { usersReady: 0 }).exec();
    // await io.to(lobby).emit('rounds ready');
    // set timeout, start another round later
  }
};

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

    socket.on('host start', (userArr) => handleHostStart(socket, userArr));
    socket.on('image submit', (data) => handleImageSubmit(socket, data));
    socket.on('images finished', () => handleImagesFinished(socket));
    socket.on('guess given', (tier) => handleGuessGiven(socket, tier));
  });

  return server;
};

module.exports = socketSetup;
