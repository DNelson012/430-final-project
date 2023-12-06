const mongoose = require('mongoose');
// const _ = require('underscore');

// This is a surprise tool that will help us later
const doStuff = (str) => str.trim();

const ImageSchema = new mongoose.Schema({
  lobbyID: {
    type: String,
    required: true,
    trim: true,
  },
  ownerID: {
    type: String,
    required: true,
    trim: true,
  },
  ownerName: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
    set: doStuff,
  },
  tier: {
    type: Number,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

ImageSchema.statics.toAPI = (doc) => ({
  lobbyID: doc.lobbyID,
  owner: doc.owner,
  image: doc.image,
  tier: doc.tier,
});

const ImageModel = mongoose.model('Image', ImageSchema);
module.exports = ImageModel;
