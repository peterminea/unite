const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const homeController = require("../controllers/home");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.get("/", homeController.getIndex);
router.get("/about", homeController.getAbout);
router.get("/antibriberyAgreement", homeController.getAntibriberyAgreement);
router.get("/termsConditions", homeController.getTermsConditions);
module.exports = router;