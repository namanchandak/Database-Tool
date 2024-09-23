const express = require("express");
const router = express.Router()
const {join, commonAttribute} = require('../controller/join.controller')

router.post('/', join)
router.get('/commonAttribute', commonAttribute)


module.exports = router;