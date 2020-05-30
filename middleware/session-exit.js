module.exports = (req, res, next) => {
  if (req.query.exit == 'true') {
    if(req.session) {
      req.session.destroy();      
    } else {
      req.flash('No active session!');      
    }
  res.redirect("/");  
  }
  
  if(!req.query.home)
    next();
}