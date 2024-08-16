const express = require("express");
const router = express.Router()
const {join} = require('../controller/join.controller')

router.post('/', join)
// router.post('/', rightjoin)

module.exports = router;