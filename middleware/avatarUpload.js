const util = require("util");
const path = require("path");
const multer = require("multer");
const moment = require('moment');
const dateformat = require("dateformat");

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/avatars/');
    //callback(null, path.join('${__dirname}/../public/avatars'));
  },
  filename: (req, file, callback) => {
    const match = ["image/png", "image/jpeg", "image/bitmap"];

    if (match.indexOf(file.mimetype) === -1) {//Skip this interdiction. #1is2
      let message = '{' + file.originalname + '} is invalid. Only accept png/jpeg/bmp.';
      return callback(message, null);
    }
    
    //let date = dateformat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT');//Date.now()
    let date2 = moment(new Date().getTime()).format('h.mm.a');
    let filename =  'Avatar_' + date2 + '_' + file.originalname;
    console.log(callback);
    callback(null, filename);
  }
});

let uploadAvatars = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    let ext = path.extname(file.originalname);
    let extArray = ['.png', '.jpg', '.jpeg', '.bmp'];
    let isItIn = false;
    
    for(let i in extArray) 
      if(ext.toLowerCase() == extArray[i].toLowerCase()) {
        isItIn = true;        
      }
    
    if(!isItIn) {
        return callback(new Error('Extension forbidden. Please upload only image files.'));
      }
    console.log(callback);
    callback(null, true);
  },
  limits: {
    fileSize: 500*500 //250K
  }  
}).array("single", 1);
let uploadAvatarsMiddleware = util.promisify(uploadAvatars);
module.exports = uploadAvatarsMiddleware;