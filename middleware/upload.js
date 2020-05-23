const util = require("util");
const path = require("path");
const multer = require("multer");

var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //callback(null, '/uploads');
    callback(null, path.join('${__dirname}/../uploads'));
  },
  filename: (req, file, callback) => {
    const match = ["image/png", "image/jpeg"];

    if (1==2 && match.indexOf(file.mimetype) === -1) {//Skip this interdiction. #1is2
      var message = '{' + file.originalname + '} is invalid. Only accept png/jpeg.';
      return callback(message, null);
    }

    var filename = '(' + Date.now().toISOString() + ') -UNITE-' + file.originalname;
    callback(null, filename);
  }
});

var uploadFiles = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    var extArray = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt'];
    var isItIn = false;
    
    for(var i in extArray) 
      if(ext.toLowerCase() == extArray[i].toLowerCase()) {
        isItIn = true;        
      }
    
    if(!isItIn) {
        return callback(new Error('Extension forbidden!'));
      }
    
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 2048 //2 MB
  }  
}).array("multiple", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;