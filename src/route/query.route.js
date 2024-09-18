const express = require("express");
const router = express.Router()
const {queryFire} = require('../controller/query.controller')

router.post('/', queryFire)


module.exports = router;