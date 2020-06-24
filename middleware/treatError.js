module.exports = async (req, res, err, page) => {
  if(!err)
    return false;
  
  console.error(err.message);
  req.flash('error', err.message);
  await res.redirect(page);
  return true;
};