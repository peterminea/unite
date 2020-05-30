const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const isAuth = require("../middleware/is-auth-supplier");
const sessionExit = require("../middleware/session-exit");
const supplierController = require("../controllers/supplier");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", isAuth, sessionExit, supplierController.getIndex);
//router.get("/logout", isAuth, sessionExit, supplierController.getLogout);
router.get("/sign-in", supplierController.getSignIn);
router.get("/sign-up", supplierController.getSignUp);
router.get("/profile", isAuth, sessionExit, supplierController.getProfile);
router.get("/bid-requests", isAuth, sessionExit, supplierController.getBidRequests);
router.get("/bid-requests/:id", isAuth, sessionExit, supplierController.getBidRequest);//:id=param
router.get("/balance", isAuth, sessionExit, supplierController.getBalance);
router.get("/addproduct", isAuth, sessionExit, supplierController.getAddProduct);
router.get('/resend', isAuth, sessionExit, supplierController.getResendToken);
router.get("/confirmation/:token", isAuth, sessionExit, supplierController.getConfirmation);
router.get("/forgotPassword", isAuth, sessionExit, supplierController.getForgotPassword);
router.get("/chat/:supplierId/:buyerId/:requestId/:requestName/:buyerName/:supplierName", isAuth, sessionExit, supplierController.getChat);
router.get("/resetPassword/:token", isAuth, sessionExit, supplierController.getResetPasswordToken);

router.post("/sign-in", supplierController.postSignIn);
router.post("/sign-up", supplierController.postSignUp);
router.post("/profile", isAuth, sessionExit, supplierController.postProfile);
router.post("/bid-requests/:id", isAuth, sessionExit, supplierController.postBidRequest);
router.post("/addproduct", isAuth, sessionExit, supplierController.postAddProduct);
router.post('/confirmation/:token', isAuth, sessionExit, supplierController.postConfirmation);
router.post('/resend', isAuth, sessionExit, supplierController.postResendToken);
router.post("/forgotPassword", isAuth, sessionExit, supplierController.postForgotPassword);
router.post("/resetPassword/:token", isAuth, sessionExit, supplierController.postResetPasswordToken);

module.exports = router;