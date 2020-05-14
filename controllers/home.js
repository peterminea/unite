exports.getIndex = (req, res) => {
  res.render("index");
};

exports.getAbout = (req, res) => {
  res.render("about");
}

exports.getAntibriberyAgreement = (req, res) => {
  res.render("antibriberyAgreement");
};

exports.getTermsConditions = (req, res) => {
  res.render("termsConditions");
}