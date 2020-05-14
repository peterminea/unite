const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const bidRequestController = require("../controllers/bidRequest");
const isAuth = require("../middleware/is-auth-buyer");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/", isAuth, bidRequestController.postIndex);
module.exports = router;