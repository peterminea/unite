module.exports = (req, res, err, page) => {
  if(!err || !err.message)
    return false;
  
  console.error(err.message + ' ' + ' POLLY STEERFORTH');
  req.flash('error', err.message);
  res.redirect(page);
  return true;
};