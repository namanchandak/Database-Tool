const express = require('express');
const app = express();
const connection = require('./config/config');
const fs = require('fs');
const path = require('path');

app.use(express.json()); 

app.listen(8080, () => { 
    console.log("Server running on port 8080");
});

app.get("/", (req, res) => {  
    res.send("Server running on port 8080");
});

// SELECT salaryt.salId, empt.name, empt.id  FROM empt  LEFT JOIN salaryt ON empt.id = salaryt.empId
// SELECT empt.name, empt.id, salaryt.salId FROM empt LEFT JOIN salaryt ON empt.id = salaryt.empId


// SELECT empt.name, empt.id, salaryt.salId FROM empt LEFT JOIN salaryt ON empt.id = salaryt.salaryt.empId


const configPath = path.join(__dirname, 'dbconfig.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('Error reading config file:', err);
}

app.post('/join', async (req, res) => {
    const { selectColumns } = req.body;
  
    if (!selectColumns) {
      return res.status(400).send('Missing required field: selectColumns');
    }
  
    // Extract table names from selectColumns
    const tableNames = Array.from(new Set(selectColumns.match(/\w+(?=\.)/g)));
  
    if (!tableNames.length) {
      return res.status(400).send('No valid table names found in selectColumns');
    }
  
    // Start building the query
    let baseTable = tableNames[0];
    let query = `SELECT ${selectColumns} FROM ${baseTable}`;
  
    // Add LEFT JOINs based on the configuration
    tableNames.slice(1).forEach(tableName => {
      const relationship = config.tables[baseTable]?.find(rel => rel.table === tableName);
      if (relationship) {
        const onClause = relationship.commonAttributes.map(attr => {
          // Handle both directions of the relationship
          const baseTableAttr = baseTable + '.' + attr;
          const joinTableAttr = tableName + '.' + (relationship.commonAttributes[0] === 'id' ? 'empId' : attr);
          return `${baseTableAttr} = ${joinTableAttr}`;
        }).join(' AND ');
        
        query += ` LEFT JOIN ${tableName} ON ${onClause}`;
      }
    });
    // query = 'SELECT empt.name, empt.id, salaryt.salId FROM empt LEFT JOIN salaryt ON empt.id = salaryt.empId'
  
    console.log('Constructed Query:', query);
  
    try {
      const [results] = await connection.query(query);
      res.json(results);
    } catch (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('An error occurred while fetching data');
    }
  });