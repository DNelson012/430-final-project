require('dotenv').config();

const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const router = require('./router.js');
const socketSetup = require('./io.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/TierGuesser';
mongoose.connect(dbURI).catch((err) => {
  if (err) {
    console.log('Could not connect to the database');
    throw err;
  }
});

const redisClient = redis.createClient({
  url: process.env.REDISCLOUD_URL,
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
  const app = express();

  app.use(helmet());
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
  app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // https://socket.io/how-to/use-with-express-session
  // The start of it at least
  const sessionMiddleware = session({
    key: 'sessionid',
    store: new RedisStore({
      client: redisClient,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  });
  app.use(sessionMiddleware);

  app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
  app.set('view engine', 'handlebars');
  app.set('views', `${__dirname}/../views`);

  router(app);
  const server = socketSetup(app, sessionMiddleware);

  server.listen(port, (err) => {
    if (err) { throw err; }
    console.log(`Listening on port ${port}`);
  });
});
