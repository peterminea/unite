const util = require("util");
const path = require("path");
const multer = require("multer");
const moment = require('moment');
const dateformat = require("dateformat");

var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //callback(null, 'public/uploads/');
    callback(null, path.join('${__dirname}/../public/uploads'));
  },
  filename: (req, file, callback) => {
    const match = ["image/png", "image/jpeg"];

    if (1==2 && match.indexOf(file.mimetype) === -1) {//Skip this interdiction. #1is2
      var message = '{' + file.originalname + '} is invalid. Only accept png/jpeg.';
      return callback(message, null);
    }

    var date = dateformat(new Date(), 'dddd_mmmm_dS_yyyy_h.MM.ss.TT');//Date.now()
    var date2 = moment(new Date().getTime()).format('h.mm.a');
    var filename =  'UNITE-'+ date2 + '_' + file.originalname;
    callback(null, filename);
  }
});

var uploadFiles = multer({
  storage: storage,
  
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    var extArray = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.docx', '.rtf'];
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
    fileSize: 1024 * 1024 //1 MB
  }  
}).array("multiple", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;