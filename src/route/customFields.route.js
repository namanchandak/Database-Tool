const express = require("express");
const router = express.Router();
const { getKeys, getValue } = require("../controller/customFields.controller");

router.get("/getKeys", getKeys);
router.get("/getValue", getValue);

module.exports = router;
