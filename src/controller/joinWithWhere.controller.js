const connection = require('../config/config');
const fs = require('fs');
const path = require('path');

// Load the config file
const configPath = path.join(__dirname, '../config/dbconfig.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    console.error('Error reading config file:', err);
    config = null; // Set config to null if loading fails
}

const joinWithWhere = async (req, res) => {

    const { selectColumns, whereCondition } = req.body;

    if (!selectColumns || !Array.isArray(selectColumns)) {
        return res.status(400).send('Missing or invalid required field: selectColumns');
    }

    if (!config) {
        return res.status(500).send('Configuration not loaded correctly');
    }

    // Extract table names from selectColumns
    const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));

    if (!tableNames.length) {
        return res.status(400).send('No valid table names found in selectColumns');
    }

    // Start building the query
    let baseTable = tableNames[0];
    let query = `SELECT ${selectColumns.map(col => {
        const [tableAlias, column] = col.split('.');
        return `${tableAlias}.${column}`;
    }).join(', ')} FROM ${baseTable} AS ${baseTable}`;
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

                query += ` LEFT JOIN ${relationship.table} AS ${relationship.table} ON ${onClause}`;
                addJoins(relationship.table);
            }
        });
    };

    addJoins(baseTable);

    // Apply WHERE condition if provided
    if (whereCondition && Array.isArray(whereCondition)) {

        const whereClauses = whereCondition.map(({ logic, field, operator, value, tableValue }, index) => {
            if (!field || !operator || (!tableValue && value === undefined)) {
                throw new Error('Invalid condition format');
            }

            let clause;
            if (tableValue) {
                // Use tableValue directly for column-to-column comparison
                clause = `${field} ${operator} ${tableValue}`;
            } else if (operator === 'BETWEEN' && Array.isArray(value)) {
                clause = `${field} ${operator} ? AND ?`;
            } else {
                clause = `${field} ${operator} ?`;
            }

            // Add logic operator (AND/OR) before each condition except the first one
            return index > 0 ? `${logic} ${clause}` : clause;
        }).join(' ');

        // Flatten the values for the prepared statement (only for non-tableValue references)
        const whereValues = whereCondition.flatMap(({ value, tableValue }) => {
            if (tableValue) {
                return []; // Skip tableValue as it's used directly in the query
            }
            return value;
        });

        query += ` WHERE ${whereClauses}`;

        // Log the final query for debugging
        console.log('Executing Query:', query, whereValues);

        // Execute the query with WHERE condition
        try {
            const [results] = await connection.execute(query, whereValues);
            res.json(results);
        } catch (error) {
            console.error('Error executing query with WHERE condition:', error.stack);
            res.status(500).send('An error occurred while fetching data');
        }
    } else {
        // Log the final query for debugging
        console.log('Executing Query:', query);

        // Execute the query without WHERE condition
        try {
            const [results] = await connection.query(query);
            res.json(results);
        } catch (error) {
            console.error('Error executing query:', error.stack);
            res.status(500).send('An error occurred while fetching data');
        }
    }
};

module.exports = { joinWithWhere };
