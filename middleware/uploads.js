const multer = require("multer");
const fs = require("fs-extra");
const moment = require("moment");
const dateformat = require("dateformat");
const path = require("path");
const uploadController = require("../controllers/upload");
const uploadAvatarController = require("../controllers/uploadAvatar");
const xlsx = require("node-xlsx");

const extArray = [".png", ".jpg", ".jpeg", ".gif", ".bmp", '.csv', ".pdf", ".txt", ".doc", ".docx", ".rtf", '.xls', '.xlsx', '.ppt', '.pptx'],
  prodImageArray = ['.png', '.jpg', '.jpeg', '.bmp', '.csv', '.gif'],
  excelArray = [".xls", ".xlsx"];

//Upload files to Glitch:
const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/uploads"));
  },
  filename: function(req, file, callback) {
    // + path.extname(file.originalname)
    let date = dateformat(new Date(), "dddd_mmmm_dS_yyyy_h.MM.ss_TT"); //Date.now()
    let date2 = moment(new Date().getTime()).format("HH.mm.ss.a");
    callback(null, file.fieldname + "_" + date2 + "_" + file.originalname); //The name itself.
  }
});


const upload = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in extArray)
      if (ext.toLowerCase() == extArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Extension forbidden!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
  }
});


const uploadExcel = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in excelArray)
      if (ext.toLowerCase() == excelArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Please upload an Excel file!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
  }
});


const prodImageStorage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/productImages"));    
  },
  filename: function(req, file, callback) {
    let date = dateformat(new Date(), "dddd_mmmm_dS_yyyy_h.MM.ss_TT"); //Date.now()
    let date2 = moment(new Date().getTime()).format("HH.mm.ss.a");
    callback(null, file.originalname.substring(file.originalname.lastIndexOf('.')+1) + "_" + date + "_" + file.originalname); //The name itself.
  }
});


const uploadProdImage = multer({
  storage: prodImageStorage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in prodImageArray)
      if (ext.toLowerCase() == prodImageArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Please upload an image file!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
  }
});


const uploadSingleFile = (req, res, next) => {
  const file = req.file;
  
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
  return true;
  
  let tmp_path = req.file.path;
  let target_path = "custom/uploads/" + req.file.originalname;
  let src = fs.createReadStream(tmp_path);
  let dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on("end", function() {
    res.render("complete");
  });
  src.on("error", function(err) {
    res.render("error");
  });
}

const uploadMultipleFiles = (req, res, next) => {
    const files = req.files;

    if (!files) {
      const error = new Error("Please choose maximum 10 files.");
      error.httpStatusCode = 400;
      return next(error);
    }

    console.log(files);
    res.send(files);
}


const uploadProductImage = (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
}


const uploadExcelFile = (req, res, next) => {
 const file = req.file;

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  let obj = xlsx.parse(fs.readFileSync(file.path));
  fs.unlinkSync(file);

  if(obj && obj.length) {
    console.log(obj[0].data);
    //Treat the obj variable as an array of rows:
    res.send(obj[0].data);
  } else {
    res.send("Error!");
  }  
}



module.exports = { upload, uploadExcel, uploadProdImage, uploadSingleFile, uploadMultipleFiles, uploadProductImage, uploadExcelFile };