const express = require("express");
const router = express.Router()
const {getJsonData} = require('../controller/jsonData.controller')

router.get('/', getJsonData)
module.exports = router;