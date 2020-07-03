const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-buyer");
const sessionExit = require("../middleware/session-exit");
const buyerController = require("../controllers/buyer");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, buyerController.getIndex);
router.get("/sign-in", buyerController.getSignIn);
router.get("/sign-up", buyerController.getSignUp);
router.get("/profile", isAuth, sessionExit, buyerController.getProfile);
router.get("/deactivate/:id", isAuth, sessionExit, buyerController.getDeactivate);
router.get("/delete/:id", isAuth, sessionExit, buyerController.getDelete);
router.get("/balance", isAuth, sessionExit, buyerController.getBalance);
router.get("/confirmation/:token", sessionExit, buyerController.getConfirmation);
router.get('/resend', /*isAuth,*/ sessionExit, buyerController.getResendToken);
router.get("/forgotPassword", isAuth, sessionExit, buyerController.getForgotPassword);
router.get("/resetPassword/:token", isAuth, sessionExit, buyerController.getResetPasswordToken);
router.get("/viewBid/:supplierId/:buyerId/:currency/:balance", isAuth, sessionExit, buyerController.getViewBids);
router.get("/chatLogin/:supplierId/:buyerId/:requestId/:requestName/:buyerName/:supplierName", isAuth, sessionExit, buyerController.getChatLogin);
router.get("/chat/:from/:to/:username/:room/:reqId/:reqName/:toName/:fromName", isAuth, sessionExit, buyerController.getChat);
router.get("/cancelBid/:bidId/:bidName/:userType/:buyerName/:supplierName/:buyerEmail/:supplierEmail", isAuth, sessionExit, buyerController.getCancelBid);

router.post("/", isAuth, sessionExit, buyerController.postIndex);
router.post("/sign-in", buyerController.postSignIn);
router.post("/sign-up", buyerController.postSignUp);
router.post('/profile', isAuth, sessionExit, buyerController.postProfile);
router.post("/deactivate", isAuth, sessionExit, buyerController.postDeactivate);
router.post("/delete", isAuth, sessionExit, buyerController.postDelete);
router.post('/confirmation/:token', sessionExit, buyerController.postConfirmation);
router.post('/resend', /*isAuth,*/ sessionExit, buyerController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, buyerController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, buyerController.postResetPasswordToken);
router.post("/viewBid", isAuth, sessionExit, buyerController.postViewBids);
router.post("/cancelBid", isAuth, sessionExit, buyerController.postCancelBid);

module.exports = router;