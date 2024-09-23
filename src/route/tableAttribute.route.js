const express = require("express");
const router = express.Router()
const {getTable} = require('../controller/tableAttribute.controller')
const {getColumn} = require('../controller/tableAttribute.controller')

router.get('/table', getTable)
router.post('/column', getColumn)

module.exports = router;