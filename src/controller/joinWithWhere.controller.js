const pool = require('../config/config');
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
        return res.status(400).json({ error: 'Missing or invalid required field: selectColumns' });
    }

    if (!config) {
        return res.status(500).json({ error: 'Configuration not loaded correctly' });
    }

    // Extract table names from selectColumns
    const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));

    if (!tableNames.length) {
        return res.status(400).json({ error: 'No valid table names found in selectColumns' });
    }

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
        // Function to recursively build the WHERE clause
        const buildWhereClause = (conds) => {
            return conds.map(({ logic = 'AND', field, operator, value, tableValue, conditions }, index) => {
                if (conditions) {
                    // Recursively handle nested conditions with parentheses
                    const nestedClause = buildWhereClause(conditions);
                    return index > 0 ? `${logic.toUpperCase()} (${nestedClause})` : `(${nestedClause})`;
                }

                if (!field || !operator || (!tableValue && value === undefined && (operator !== 'IS NULL' && operator !== 'IS NOT NULL'))) {
                    throw new Error('Invalid condition format');
                }

                let clause;
                if (tableValue) {
                    // Use tableValue directly for column-to-column comparison
                    clause = `${field} ${operator} ${tableValue}`;
                } else if (operator.toUpperCase() === 'BETWEEN' && Array.isArray(value)) {
                    clause = `${field} ${operator.toUpperCase()} ? AND ?`;
                } else if (operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
                    // Handle IS NULL and IS NOT NULL operators without placeholders
                    clause = `${field} ${operator.toUpperCase()}`;
                } else {
                    clause = `${field} ${operator.toUpperCase()} ?`;
                }

                // Add logic operator (AND/OR) before each condition except the first one
                return index > 0 ? `${logic.toUpperCase()} ${clause}` : clause;
            }).join(' ');
        };

        const whereClauses = buildWhereClause(whereCondition);

        // Flatten the values for the prepared statement
        const flattenValues = (conds) => {
            return conds.flatMap(({ value, tableValue, operator, conditions }) => {
                if (conditions) {
                    return flattenValues(conditions);
                }
                if (tableValue || operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
                    return []; // Skip tableValue and NULL checks as they don't require placeholders
                }
                if (operator.toUpperCase() === 'BETWEEN') {
                    return value; // Handle BETWEEN with two values
                }
                return value;
            });
        };
        const values = flattenValues(whereCondition);

        query += ` WHERE ${whereClauses}`;

        // Log the final query for debugging
        console.log('Executing Query:', query, 'With Values:', values);

        // Get a connection from the pool
        try {
            const connection = await pool.getConnection();

            try {
                // Execute the query with WHERE condition
                const [results] = await connection.execute(query, values);
                res.json(results);
            } finally {
                // Release the connection back to the pool
                connection.release();
            }
        } catch (error) {
            console.error('Error executing query with WHERE condition:', error.message);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    } else {
        // Log the final query for debugging
        console.log('Executing Query:', query);

        // Get a connection from the pool
        try {
            const connection = await pool.getConnection();

            try {
                // Execute the query without WHERE condition
                const [results] = await connection.query(query);
                res.json(results);
            } finally {
                // Release the connection back to the pool
                connection.release();
            }
        } catch (error) {
            console.error('Error executing query:', error.message);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
};

module.exports = { joinWithWhere };
