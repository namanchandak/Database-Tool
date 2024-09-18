const express = require("express");
const router = express.Router()
const {dbConfigGet, dbConfigPost} = require('../controller/dbConfig.controller')

router.get('/', dbConfigGet)
router.post('/', dbConfigPost)

module.exports = router;