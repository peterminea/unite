module.exports = (req, res, next) => {
  if (!req.session.buyerId) 
    return res.redirect("/buyer/sign-in");
  next();
}