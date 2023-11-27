const models = require('../models');

const { Aaah } = models;

const makerPage = async (req, res) => res.render('menu');

const getAaahs = async (req, res) => {
  try {
    const query = { owner: req.session.account._id };
    const docs = await Aaah.find(query).select('name level age').lean().exec();

    return res.json({ aaahs: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving aaahs!' });
  }
};

const makeAaah = async (req, res) => {
  if (!req.body.name || !req.body.level || !req.body.age) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  const aaahData = {
    name: req.body.name,
    level: req.body.level,
    age: req.body.age,
    owner: req.session.account._id,
  };

  try {
    const newAaah = new Aaah(aaahData);
    await newAaah.save();

    return res.status(201).json({
      name: newAaah.name,
      level: newAaah.level,
      age: newAaah.age,
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Aaah already exists!' });
    }

    return res.status(500).json({ error: 'An error occured making aaah!' });
  }
};

const deleteAaah = async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  try {
    const query = { owner: req.session.account._id, _id: req.body.id };
    const doc = await Aaah.deleteOne(query).lean().exec();

    if (!doc.acknowledged || doc.deletedCount !== 1) {
      return res.status(500).json({ error: 'Error deleting aaah! (Really unexpected)' });
    }

    return res.status(204).json({ message: 'Aaah deleted!' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting aaah!' });
  }
};

module.exports = {
  makerPage,
  getAaahs,
  makeAaah,
  deleteAaah,
};
