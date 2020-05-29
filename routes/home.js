const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const sessionExit = require("../middleware/session-exit");
const homeController = require("../controllers/home");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.get("/", /*sessionExit,*/ homeController.getIndex);
router.get("/about", sessionExit, homeController.getAbout);
router.get("/antibriberyAgreement", sessionExit, homeController.getAntibriberyAgreement);
router.get("/termsConditions", sessionExit, homeController.getTermsConditions);
module.exports = router;