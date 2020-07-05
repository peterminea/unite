module.exports = (flash, type) => {
  if(!flash || !flash.length) {
    return null;
  }
  
  var message = "";
  var cnt = 0;
  
  for(var i in flash) {
    if(flash[i].type == type) {
      if(cnt)
        message += '\n';
      message += flash[i].message;
      cnt++;
    }
  }
  
  return message;
}