module.exports.Account = require('./Account.js');
module.exports.Menu = require('./Menu.js');

const notFound = (req, res) => {
  res.status(404).render('notFound', {
    page: req.url,
  });
};
module.exports.notFound = notFound;
