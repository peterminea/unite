const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const sessionExit = require("../middleware/session-exit");
const homeController = require("../controllers/home");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.get("/", sessionExit, homeController.getIndex);
router.get("/filesList", sessionExit, homeController.getFilesList);
router.get("/about", sessionExit, homeController.getAbout);
router.get("/antibriberyAgreement", sessionExit, homeController.getAntibriberyAgreement);
router.get("/termsConditions", sessionExit, homeController.getTermsConditions);
router.get("/memberList", sessionExit, homeController.getMemberList);
router.get("/bidsList", sessionExit, homeController.getBidsList);
router.get("/feedback", sessionExit, homeController.getFeedback);
router.get("/viewFeedbacks", sessionExit, homeController.getViewFeedbacks);
router.get("/deleteUser/:id/:type/:name/:uniteID/:email", sessionExit, homeController.getDeleteUser);
router.get("/banUser/:id/:type/:name/:uniteID/:email/:ipv4Address", sessionExit, homeController.getBanUser);

router.post("/feedback", sessionExit, homeController.postFeedback);
router.post("/deleteUser/:id/:type/:name/:uniteID/:email", sessionExit, homeController.postDeleteUser);
router.post("/banUser/:id/:type/:name/:uniteID/:email/:ipv4Address", sessionExit, homeController.postBanUser);

module.exports = router;