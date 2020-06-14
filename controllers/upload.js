const upload = require("../middleware/upload");

const multipleUpload = async (req, res) => {
  try {
    await upload(req, res);
    if (req.files.length <= 0) {
      return res.send('You must select at least one file.');
    }

    return req.files.length == 1? res.send('File has been uploaded!') : res.send('Files have been uploaded!');
  } catch (error) {
    console.log(error);
    req.flash('error', error.message);    

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.send("Too many files to upload. Please refine your selection.");
    }
    
    return res.send('Error while trying to upload requested files: {' + error + '}');
  }
};

module.exports = {
  multipleUpload: multipleUpload
};