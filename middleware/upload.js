const util = require("util");
const path = require("path");
const multer = require("multer");
const moment = require('moment');
const dateformat = require("dateformat");

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //callback(null, 'public/uploads/');
    callback(null, path.join('${__dirname}/../public/uploads'));
  },
  filename: (req, file, callback) => {
    const match = ["image/png", "image/jpeg"];

    if (1==2 && match.indexOf(file.mimetype) === -1) {//Skip this interdiction. #1is2
      let message = '{' + file.originalname + '} is invalid. Only accept png/jpeg.';
      return callback(message, null);
    }

    let date = dateformat(new Date(), 'dddd_mmmm_dS_yyyy_h.MM.ss.TT');//Date.now()
    let date2 = moment(new Date().getTime()).format('h.mm.a');
    let filename =  'UNITE-'+ date2 + '_' + file.originalname;
    callback(null, filename);
  }
});

let uploadFiles = multer({
  storage: storage,
  
  fileFilter: function (req, file, callback) {
    let ext = path.extname(file.originalname);
    let extArray = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.docx', '.rtf'];
    let isItIn = false;
    
    for(let i in extArray) 
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
let uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;