module.exports = (flash, type) => {
  if(!flash || !flash.length) {
    return null;
  }
  
  let message = "";
  let cnt = 0;
  
  for(let i in flash) {
    if(flash[i].type == type) {
      if(cnt)
        message += '\n';
      message += flash[i].message;
      cnt++;
    }
  }
  
  return message;
}