const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.redirect('/');
  }

  return next();
};

const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.redirect('/menu');
  }

  return next();
};

const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }

  return next();
};

const bypassSecure = (req, res, next) => {
  next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}

// Lobby checking
// If I had an HTTP request that only would be allowed in a lobby,
// I'd need to use something like this
//  I don't, so this never is used currently
const requiresLobby = (req, res, next) => {
  if (!req.session.lobbyID) {
    return res.redirect('/menu');
  }

  return next();
};

module.exports.requiresLobby = requiresLobby;
