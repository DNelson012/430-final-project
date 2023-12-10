const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => res.render('login');

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    req.session.account = Account.toAPI(account);
    req.session.username = username;

    return res.json({ redirect: '/menu' });
  });
};

const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    req.session.username = username;

    return res.json({ redirect: '/menu' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use!' });
    }
    return res.status(500).json({ error: 'An error occured!' });
  }
};

const pwchangePage = (req, res) => res.render('password');

const changePassword = async (req, res) => {
  const passOld = `${req.body.passOld}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!passOld || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (!req.session.username) {
    return res.status(400).json({ error: 'No username? (Login again)' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  // Async function that gets called for authenticating 
  const callback = async (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    // Start changing the password
    try {
      const hash = await Account.generateHash(pass);
      await Account.updatePassword(req.session.username, hash)
      return res.json({ redirect: '/menu' });
    } catch (errPW) {
      console.log(errPW);
      return res.status(500).json({ error: 'An error occured!' });
    }
  }
  return Account.authenticate(req.session.username, passOld, callback);
};

module.exports = {
  loginPage,
  login,
  signup,
  logout,
  pwchangePage,
  changePassword,
};
