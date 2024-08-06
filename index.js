const express = require('express');
const app = express();

app.use(express.json()); 

app.listen(8080, () => { 
    console.log("Server running on port 8080");
});

const serverRoute = require('../DB tool/src/route/server.route')
const join = require('../DB tool/src/route/join.route')
const jsonData = require('../DB tool/src/route/jsonData.route')

app.use("/", serverRoute)
app.use("/join", join)
app.use("/jsonData", jsonData)

