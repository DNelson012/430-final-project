
const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/menu', mid.requiresLogin, controllers.Menu.menuPage);

  // app.get('/getLobby', mid.requiresLogin, controllers.Lobby.getLobby);
  // app.post('/makeLobby', mid.requiresLogin, controllers.Lobby.makeLobby);
  // app.post('/addUser', mid.requiresLogin, controllers.Lobby.addUser);
  // app.post('/removeUser', mid.requiresLogin, controllers.Lobby.removeUser);
  // app.delete('/deleteLobby', mid.requiresLogin, controllers.Lobby.deleteLobby);

  app.get('/*', controllers.notFound);
};

module.exports = router;
