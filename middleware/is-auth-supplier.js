module.exports = (req, res, next) => {
  if (!req.session.supplierId)
    return res.redirect("/supplier/sign-in");
  next();
}