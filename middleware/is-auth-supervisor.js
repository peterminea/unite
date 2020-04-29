module.exports = (req, res, next) => {
  if (!req.session.supervisorId) return res.redirect("/supervisor/sign-in");
  next();
};
