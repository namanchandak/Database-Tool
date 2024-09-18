const express = require('express');
const app = express();

app.use(express.json()); 

app.listen(8080, () => { 
    console.log("Server running on port 8080");
});

const serverRoute = require('./src/route/server.route')
const join = require('./src/route/join.route')
const jsonData = require('./src/route/jsonData.route')
const whereClause = require('./src/route/whereClause.router')
const query = require('./src/route/query.route')
const dbConfig = require('./src/route/dbConfig.route')
const tableAttribute = require('./src/route/tableAttribute.route')


app.use("/", serverRoute)
app.use("/join", join)
app.use("/where", whereClause)
app.use("/jsonData", jsonData)
app.use("/query", query)
app.use("/dbConfig", dbConfig)
app.use("/dbData", tableAttribute)

