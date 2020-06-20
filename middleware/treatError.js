module.exports = (req, res, err, page) => {
  if(err) {
  req.flash('error', err.message);
  console.error(err.message);
  res.redirect(page);
  }
}