const express = require("express");
const router = express.Router()
const {queryFire, queryFireV2} = require('../controller/query.controller')

router.post('/', queryFire)
router.post('/v2', queryFireV2)


module.exports = router;