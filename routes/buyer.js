const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-buyer");
const sessionExit = require("../middleware/session-exit");
const buyerController = require("../controllers/buyer");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, buyerController.getIndex);
//router.get("/logout", isAuth, sessionExit, buyerController.getLogout);
router.get("/sign-in", buyerController.getSignIn);
router.get("/sign-up", buyerController.getSignUp);
router.get("/profile", isAuth, sessionExit, buyerController.getProfile);
router.get("/balance", isAuth, sessionExit, buyerController.getBalance);
//router.get("/supplier", isAuth, sessionExit, buyerController.getSupplier);
router.get("/confirmation/:token", isAuth, sessionExit, buyerController.getConfirmation);
router.get('/resend', buyerController.getResendToken);
router.get("/forgotPassword", isAuth, sessionExit, buyerController.getForgotPassword);
router.get("/resetPassword/:token", isAuth, sessionExit, buyerController.getResetPasswordToken);

router.post("/", isAuth, buyerController.postIndex);
router.post("/sign-in", buyerController.postSignIn);
router.post("/sign-up", buyerController.postSignUp);
router.post('/profile', buyerController.postProfile);
router.post('/confirmation/:token', buyerController.postConfirmation);
router.post('/resend', buyerController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, buyerController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, buyerController.postResetPasswordToken);

module.exports = router;