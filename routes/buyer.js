const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const isAuth = require("../middleware/is-auth-buyer");
const sessionExit = require("../middleware/session-exit");

const buyerController = require("../controllers/buyer");

router.get("/", isAuth, sessionExit, buyerController.getIndex);
router.get("/sign-in", buyerController.getSignIn);
router.get("/profile", isAuth, sessionExit, buyerController.getProfile);

router.post("/", isAuth, buyerController.postIndex);
router.post("/sign-in", buyerController.postSignIn);

module.exports = router;