const express = require("express");
const router = express.Router()
const {dbConfigGet} = require('../controller/dbConfig.controller')

router.get('/', dbConfigGet)

module.exports = router;