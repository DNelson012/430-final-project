
const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  
  app.get('/menu', mid.requiresLogin, controllers.Menu.menuPage);

  //app.get()

  app.get('/*', controllers.notFound);



  app.get('/getAaahs', mid.requiresLogin, controllers.Aaah.getAaahs);
  app.delete('/deleteAaah', mid.requiresLogin, controllers.Aaah.deleteAaah);

  app.get('/maker', mid.requiresLogin, controllers.Aaah.makerPage);
  app.post('/maker', mid.requiresLogin, controllers.Aaah.makeAaah);
};

module.exports = router;
