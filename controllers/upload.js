const upload = require("../middleware/upload");

const multipleUpload = async (req, res) => {console.log('concole');
  try {
    await upload(req, res);
    console.log(req.files);

    if (req.files.length <= 0) {
      return res.send('You must select at least one file.');
    }

    return res.send('Files have been uploaded!');
  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.send("Too many files to upload. Please refine your selection.");
    }
    return res.send('Error while trying to upload many files:${' + error + '}');
  }
};

module.exports = {
  multipleUpload: multipleUpload
};