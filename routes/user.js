const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.get("/:token", userController.getToken);

module.exports = router;
