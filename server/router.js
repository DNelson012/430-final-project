const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/pwchange', mid.requiresLogin, controllers.Account.pwchangePage);
  app.post('/pwchange', mid.requiresLogin, controllers.Account.changePassword);

  app.get('/menu', mid.requiresLogin, controllers.Menu.menuPage);

  app.get('/*', controllers.notFound);
};

module.exports = router;
