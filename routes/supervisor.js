const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-supervisor");
const sessionExit = require("../middleware/session-exit");
const supervisorController = require("../controllers/supervisor");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, supervisorController.getIndex);
router.get("/sign-in", supervisorController.getSignIn);
router.get("/sign-up", supervisorController.getSignUp);
router.get("/profile", isAuth, sessionExit, supervisorController.getProfile);
router.get("/forgotPassword", isAuth, sessionExit, supervisorController.getForgotPassword);
router.get("/resetPassword/:token", isAuth, sessionExit, supervisorController.getResetPasswordToken);

router.post("/sign-in", supervisorController.postSignIn);
router.post("/sign-up", supervisorController.postSignUp);
router.post('/profile', supervisorController.postProfile);
router.post('/confirmation', supervisorController.postConfirmation);
router.post('/resend', supervisorController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, supervisorController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, supervisorController.postResetPasswordToken);


module.exports = router;