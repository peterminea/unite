module.exports = (req, res, next) => {
  if (!req.session.organizationId) 
    return res.redirect("/buyer/sign-in");
  next();
};
