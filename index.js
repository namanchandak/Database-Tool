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


// SELECT empt.id, empt.name, salaryt.salId, salaryt.empId FROM empt LEFT JOIN salaryt ON empt.id = salaryt.id



const configPath = path.join(__dirname, 'dbconfig.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('Error reading config file:', err);
}




app.post('/join', async (req, res) => {
    const { selectColumns } = req.body;
  
    if (!selectColumns || !Array.isArray(selectColumns)) {
      return res.status(400).send('Missing or invalid required field: selectColumns');
    }
  
    // Extract table names from selectColumns
    const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));
  
    if (!tableNames.length) {
      return res.status(400).send('No valid table names found in selectColumns');
    }
  
    // Start building the query
    let baseTable = tableNames[0];
    let query = `SELECT ${selectColumns.join(', ')} FROM ${baseTable}`;
    let usedTables = new Set([baseTable]);
  
    // Function to find and add join conditions recursively
    const addJoins = (currentTable) => {
      config.tables[currentTable]?.forEach(relationship => {
        if (!usedTables.has(relationship.table) && tableNames.includes(relationship.table)) {
          usedTables.add(relationship.table);
  
          const onClause = relationship.commonAttributes.map(attr => {
            const currentTableAttr = `${currentTable}.${attr}`;
            const joinTableAttr = `${relationship.table}.${attr}`;
            return `${currentTableAttr} = ${joinTableAttr}`;
          }).join(' AND ');
  
          query += ` LEFT JOIN ${relationship.table} ON ${onClause}`;
          addJoins(relationship.table); // Recursively add joins for the new table
        }
      });
    };    
    
    // SELECT empt.id, empt.name, salaryt.salId, salaryt.empId FROM empt LEFT JOIN salaryt ON empt.id = salaryt.id
  
    addJoins(baseTable);
  
    console.log('Constructed Query:', query);
  
    try {
      const [results] = await connection.query(query);
      res.json(results);
    } catch (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('An error occurred while fetching data');
    }
  });
  


//   SELECT empt.empId, empt.name, salaryt.salId, salaryt.empId, amountt.salId, amountt.amount, deptt.salId FROM empt LEFT 
// JOIN salaryt ON empt.empId = salaryt.empId LEFT JOIN deptt ON salaryt.salId = deptt.salId
//  LEFT JOIN amountt ON salaryt.salId = amountt.salId
