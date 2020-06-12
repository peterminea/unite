var userData = require('../middleware/userHome');

exports.getIndex = (req, res) => {
  var obj = userData(req);
  console.log(obj);
  res.render("index", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getAbout = (req, res) => {
  var obj = userData(req);
  res.render("about", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
}

exports.getAntibriberyAgreement = (req, res) => {
  var obj = userData(req);
  res.render("antibriberyAgreement", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getTermsConditions = (req, res) => {
  var obj = userData(req);
  res.render("termsConditions", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
}