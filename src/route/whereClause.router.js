const express = require("express");
const router = express.Router()
const {whereClause} = require('../controller/whereClause.controller')

router.get('/', whereClause)


module.exports = router;