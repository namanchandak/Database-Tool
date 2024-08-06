const express = require("express");
const router = express.Router()
const {getServer} = require('../controller/server.controller')

router.get('/', getServer)

module.exports = router;