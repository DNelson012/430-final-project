const models = require('../models');

const { Lobby } = models;

const lobbyPage = async (req, res) => res.render('lobbyPage');

const getLobby = async (req, res) => {
  try {
    const query = { lobbyID: req.query.lobbyID };
    const doc = await Lobby.find(query).
      select('lobbyID host userCount numRounds').lean().exec();

    return res.json({ lobby: doc });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving lobby.' });
  }
};

const makeLobby = async (req, res) => {
  if (!req.body.lobbyID
    || !req.body.host 
    || !req.body.numRounds) {
    return res.status(400).json({ error: 'Invalid lobby creation.' });
  }

  const lobbyData = {
    lobbyID: req.body.lobbyID,
    host: req.body.host,
    numRounds: req.body.numRounds,
  };

  try {
    const newLobby = new Lobby(lobbyData);
    await newLobby.save();

    return res.status(201).json({
      lobbyID: newLobby.lobbyID,
      host: newLobby.host,
      numRounds: newLobby.numRounds,
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Lobby already exists.' });
    }

    return res.status(500).json({ error: 'Error making lobby.' });
  }
};

const deleteLobby = async (req, res) => {
  if (!req.body.lobbyID) {
    return res.status(400).json({ error: 'Lobby ID required.' });
  }

  try {
    const query = { lobbyID: req.body.lobbyID };
    const doc = await Lobby.deleteOne(query).lean().exec();

    if (!doc.acknowledged || doc.deletedCount !== 1) {
      return res.status(500).json({ error: 'Error deleting lobby (Really unexpected).' });
    }

    return res.status(204).json({ message: 'Lobby deleted.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting lobby.' });
  }
};

const addUser = async (req, res) => {
  if (!req.body.lobbyID) {
    return res.status(400).json({ error: 'Lobby ID required.' });
  }

  try {
    Lobby.updateOne({ lobbyID: req.body.lobbyID }, {$inc: { userCount: 1 }}).exec();

    return res.status(204).json({ message: 'User added.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error adding user.' });
  }
};

const removeUser = async (req, res) => {
  if (!req.body.lobbyID) {
    return res.status(400).json({ error: 'Lobby ID required.' });
  }

  try {
    Lobby.updateOne({ lobbyID: req.body.lobbyID }, {$inc: { userCount: -1 }}).exec();

    return res.status(204).json({ message: 'User removed.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error removing user.' });
  }
};

module.exports = {
  lobbyPage,
  getLobby,
  makeLobby,
  deleteLobby,
  addUser,
  removeUser,
};
