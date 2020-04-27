module.exports = (req, res, next) => {
  if (!req.session.supplier)
    return res.redirect("/supplier/sign-in");
  next();
}