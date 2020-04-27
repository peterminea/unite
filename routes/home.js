const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const homeController = require("../controllers/home");

router.get("/", homeController.getIndex);
router.get("/about", homeController.getAbout);

module.exports = router;