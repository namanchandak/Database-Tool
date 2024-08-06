const express = require("express");
const router = express.Router()
const {leftjoin, rightjoin} = require('../controller/join.controller')

router.post('/left', leftjoin)
router.post('/right', rightjoin)

module.exports = router;