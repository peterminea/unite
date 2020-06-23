module.exports = (flash, type) => {
  if(!flash || !flash.length) {
    return null;
  }
  
  for(var i in flash) {
    if(flash[i].type == type)
      return flash[i].message;
  }
  
  return null;
}