const express = require('express');
const app = express();
const connection = require('./config/config');

app.use(express.json()); 

app.listen(8080, () => { 
    console.log("Server running on port 8080");
});

app.get("/", (req, res) => {  
    res.send("Server running on port 8080");
});

// SELECT salaryt.salId, empt.name, empt.id  FROM empt  LEFT JOIN salaryt ON empt.id = salaryt.empId
app.post('/join', async (req, res) => {

    console.log('Request Body:', req.body);

    const { table1, table2, joinColumn, selectColumns } = req.body;
  
    if (!table1 || !table2 || !joinColumn || !selectColumns) {
        return res.status(400).send('Missing required fields in the request body');
    }
  
    const validTableNames = ['empt', 'salaryt']; 
    if (!validTableNames.includes(table1) || !validTableNames.includes(table2)) {
        return res.status(400).send('Invalid table name');
    }
  
    // Construct the SQL query
    const query = `
      SELECT ${selectColumns}
      FROM ${table1}
      LEFT JOIN ${table2} ON ${table1}.id = ${table2}.${joinColumn}
    `;
  
    try {
        const [results] = await connection.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).send('An error occurred while fetching data');
    }
});
