const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-supplier");
const sessionExit = require("../middleware/session-exit");
const supplierController = require("../controllers/supplier");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, supplierController.getIndex);
router.get("/sign-in", supplierController.getSignIn);
router.get("/sign-up", supplierController.getSignUp);
router.get("/profile", isAuth, sessionExit, supplierController.getProfile);
router.get("/deactivate/:id", isAuth, sessionExit, supplierController.getDeactivate);
router.get("/delete/:id", isAuth, sessionExit, supplierController.getDelete);
router.get("/bid-requests", isAuth, sessionExit, supplierController.getBidRequests);
router.get("/bid-requests/:id", isAuth, sessionExit, supplierController.getBidRequest);//:id=param
router.get("/balance", isAuth, sessionExit, supplierController.getBalance);
router.get("/addproduct", isAuth, sessionExit, supplierController.getAddProduct);
router.get('/resend', /*isAuth,*/ sessionExit, supplierController.getResendToken);
router.get("/confirmation/:token", sessionExit, supplierController.getConfirmation);
router.get("/forgotPassword", isAuth, sessionExit, supplierController.getForgotPassword);
router.get("/resetPassword/:token", isAuth, sessionExit, supplierController.getResetPasswordToken);
router.get("/chatLogin/:supplierId/:buyerId/:requestId/:requestName/:buyerName/:supplierName", isAuth, sessionExit, supplierController.getChatLogin);
router.get("/chat/:from/:to/:username/:room/:reqId/:reqName/:toName/:fromName", isAuth, sessionExit, supplierController.getChat);
router.get("/cancelBid/:bidId/:bidName/:userType/:buyerName/:supplierName/:buyerEmail/:supplierEmail", isAuth, sessionExit, supplierController.getCancelBid);

router.post("/sign-in", supplierController.postSignIn);
router.post("/sign-up", supplierController.postSignUp);
router.post("/profile", isAuth, sessionExit, supplierController.postProfile);
router.post("/deactivate/:id", isAuth, sessionExit, supplierController.postDeactivate);
router.post("/delete/:id", isAuth, sessionExit, supplierController.postDelete);
router.post("/bid-requests/:id", isAuth, sessionExit, supplierController.postBidRequest);
router.post("/addproduct", isAuth, sessionExit, supplierController.postAddProduct);
router.post('/confirmation/:token', sessionExit, supplierController.postConfirmation);
router.post('/resend', /*isAuth,*/ sessionExit, supplierController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, supplierController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, supplierController.postResetPasswordToken);
router.post("/cancelBid/:bidId/:bidName/:userType/:buyerName/:supplierName/:buyerEmail/:supplierEmail", isAuth, sessionExit, supplierController.postCancelBid);

module.exports = router;