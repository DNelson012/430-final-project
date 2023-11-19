const mongoose = require('mongoose');
const _ = require('underscore');

const setName = (name) => _.escape(name).trim();

const AaahSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },
  level: {
    type: Number,
    min: 0,
    required: true,
  },
  age: {
    type: Number,
    min: 0,
    required: true,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

AaahSchema.statics.toAPI = (doc) => ({
  name: doc.name,
  level: doc.level,
  age: doc.age,
});

const AaahModel = mongoose.model('Aaah', AaahSchema);
module.exports = AaahModel;
