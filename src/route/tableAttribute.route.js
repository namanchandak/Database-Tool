const express = require("express");
const router = express.Router()
const {getTable} = require('../controller/tableAttribute.controller')
const {getColumn} = require('../controller/tableAttribute.controller')

router.get('/table', getTable)
router.get('/column', getColumn)

module.exports = router;