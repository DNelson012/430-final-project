const mongoose = require('mongoose');
const _ = require('underscore');

const escapeStr = (str) => _.escape(str).trim();

const LobbySchema = new mongoose.Schema({
  lobbyID: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  host: {
    type: String,
    required: true,
    trim: true,
    set: escapeStr,
  },
  userCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  numRounds: {
    type: Number,
    min: 1,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

LobbySchema.statics.toAPI = (doc) => ({
  lobbyID: doc.lobbyID,
  host: doc.host,
  numRounds: doc.numRounds,
});

const LobbyModel = mongoose.model('Lobby', LobbySchema);
module.exports = LobbyModel;
