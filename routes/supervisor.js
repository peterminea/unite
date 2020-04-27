const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const isAuth = require("../middleware/is-auth-supervisor");
const sessionExit = require("../middleware/session-exit")

const supervisorController = require("../controllers/supervisor");

router.get("/", isAuth, sessionExit, supervisorController.getIndex);
router.get("/sign-in", supervisorController.getSignIn);
router.get("/profile", isAuth, sessionExit, supervisorController.getProfile);
router.post("/sign-in", supervisorController.postSignIn);
module.exports = router;