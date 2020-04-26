const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

const isAuth = require("../middleware/is-auth-supplier");
const sessionExit = require("../middleware/session-exit");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const supplierController = require("../controllers/supplier");

router.get("/", isAuth, sessionExit, supplierController.getIndex);
router.get("/sign-in", supplierController.getSignIn);
router.get("/profile", isAuth, sessionExit, supplierController.getProfile);

router.post("/sign-in", supplierController.postSignIn);

module.exports = router;