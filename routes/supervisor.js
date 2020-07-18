const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-supervisor");
const sessionExit = require("../middleware/session-exit");
const supervisorController = require("../controllers/supervisor");
const buyerController = require("../controllers/buyer");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, supervisorController.getIndex);
router.get("/sign-in", supervisorController.getSignIn);
router.get("/sign-up", supervisorController.getSignUp);
router.get("/profile", isAuth, sessionExit, supervisorController.getProfile);
router.get("/deactivate/:id/:organizationUniteID", isAuth, sessionExit, supervisorController.getDeactivate);
router.get("/delete/:id/:organizationUniteID", isAuth, sessionExit, supervisorController.getDelete);
router.get('/resend', /*isAuth,*/ sessionExit, supervisorController.getResendToken);
router.get("/confirmation/:token", sessionExit, supervisorController.getConfirmation);
router.get("/forgotPassword", isAuth, sessionExit, supervisorController.getForgotPassword);
router.get("/resetPassword/:token", isAuth, sessionExit, supervisorController.getResetPasswordToken);
router.get("/chatLogin/:supplierId/:buyerId/:requestId/:requestName/:buyerName/:supplierName", isAuth, sessionExit, supervisorController.getChatLogin);
router.get("/chat/:from/:to/:username/:room/:reqId/:reqName/:toName/:fromName", isAuth, sessionExit, supervisorController.getChat);
router.get("/deleteBuyer/:id", isAuth, sessionExit, buyerController.getDelete);

router.post("/sign-in", supervisorController.postSignIn);
router.post("/sign-up", supervisorController.postSignUp);
router.post('/profile', isAuth, sessionExit, supervisorController.postProfile);
router.post("/deactivate", isAuth, sessionExit, supervisorController.postDeactivate);
router.post("/delete", isAuth, sessionExit, supervisorController.postDelete);
router.post('/confirmation/:token', sessionExit, supervisorController.postConfirmation);
router.post('/resend', /*isAuth,*/ sessionExit, supervisorController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, supervisorController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, supervisorController.postResetPasswordToken);
router.post("/deleteBuyer", isAuth, sessionExit, buyerController.postDelete);

module.exports = router;