module.exports = (req, res, next) => {
  if (req.query.exit == 'true') {
    req.session.destroy();
    res.redirect("/");
  }
  next();
}