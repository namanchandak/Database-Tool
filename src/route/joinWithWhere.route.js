const express = require("express");
const router = express.Router()
const {joinWithWhere} = require('../controller/joinWithWhere.controller')

router.post('/', joinWithWhere)


module.exports = router;