const express = require('express');
const app = express();

app.use(express.json()); 

app.listen(8080, () => { 
    console.log("Server running on port 8080");
});

const serverRoute = require('../DB tool/src/route/server.route')
const join = require('../DB tool/src/route/join.route')
const jsonData = require('../DB tool/src/route/jsonData.route')
const whereClause = require('../DB tool/src/route/whereClause.router')
const joinWithWhere = require('../DB tool/src/route/joinWithWhere.route')

app.use("/", serverRoute)
app.use("/join", join)
app.use("/where", whereClause)
app.use("/jsonData", jsonData)
app.use("/joinWithWhere", joinWithWhere)

