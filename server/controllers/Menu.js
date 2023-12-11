const menuPage = async (req, res) => {
  // This is probably not the best workaround for CSP blocking links
  res.header(
    'Content-Security-Policy',
    'img-src * https://cdn.discordapp.com/ https://pbs.twimg.com/',
  );
  res.header('Access-Control-Allow-Origin', '*'); // Neither is this

  res.render('menu');
};

module.exports = {
  menuPage,
};
