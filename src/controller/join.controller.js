

const connection = require('../config/config');
const fs = require('fs');
const path = require('path');


const configPath = path.join(__dirname, '../config/dbconfig.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    console.error('Error reading config file:', err);
}


const leftjoin = async (req, res) => {

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
                addJoins(relationship.table);
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
}


const rightjoin = async (req, res) => {
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

                query += ` right JOIN ${relationship.table} ON ${onClause}`;
                addJoins(relationship.table); // Recursively add joins for the new table
            }
        });
    };

    addJoins(baseTable);

    console.log('Constructed Query:', query);

    try {
        const [results] = await connection.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).send('An error occurred while fetching data');
    }
}



module.exports = { leftjoin, rightjoin }