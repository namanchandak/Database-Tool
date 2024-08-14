// const { joinTables } = require('./join.controller');
// const { whereClause } = require('./whereClause.controller');
const pool = require('../config/config');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/dbconfig.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    console.error('Error reading config file:', err);
}

const joinWithWhere = async (req, res) => {
    try {
        // First, build the JOIN part of the query
        let query = joinTables(req);

        // If there's a WHERE condition, use the whereClause function to append the WHERE clause
        let values = [];
        if (req.body.whereCondition && Array.isArray(req.body.whereCondition)) {
            const whereResult = whereClause(req);
            query += whereResult.query;
            values = whereResult.values;
        }

        // Execute the query
        const connection = await pool.getConnection();

        try {
            // Log the final query for debugging
            console.log('Executing Query:', query, 'With Values:', values);

            const [results] = await connection.execute(query, values);
            res.json(results);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in joinWithWhere:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

module.exports = { joinWithWhere };



const joinTables = (req) => {
    const { selectColumns } = req.body;

    if (!selectColumns || !Array.isArray(selectColumns)) {
        throw new Error('Missing or invalid required field: selectColumns');
    }

    if (!config) {
        throw new Error('Configuration not loaded correctly');
    }

    // Extract table names from selectColumns
    const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));

    if (!tableNames.length) {
        throw new Error('No valid table names found in selectColumns');
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

    return query;
};




const buildWhereClause = (conds) => {
    return conds.map(({ logic = 'AND', field, operator, value, tableValue, conditions }, index) => {
        if (conditions) {
            const nestedClause = buildWhereClause(conditions);
            return index > 0 ? `${logic.toUpperCase()} (${nestedClause})` : `(${nestedClause})`;
        }

        if (!field || !operator || (!tableValue && value === undefined && (operator !== 'IS NULL' && operator !== 'IS NOT NULL'))) {
            throw new Error('Invalid condition format');
        }

        let clause;
        if (tableValue) {
            clause = `${field} ${operator} ${tableValue}`;
        } else if (operator.toUpperCase() === 'BETWEEN' && Array.isArray(value)) {
            clause = `${field} ${operator.toUpperCase()} ? AND ?`;
        } else if (operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
            clause = `${field} ${operator.toUpperCase()}`;
        } else {
            clause = `${field} ${operator.toUpperCase()} ?`;
        }

        return index > 0 ? `${logic.toUpperCase()} ${clause}` : clause;
    }).join(' ');
};

const whereClause = (req) => {
    const { whereCondition } = req.body;
    if (!whereCondition || !Array.isArray(whereCondition)) {
        return { query: '', values: [] };
    }

    const whereClauses = buildWhereClause(whereCondition);
    const flattenValues = (conds) => {
        return conds.flatMap(({ value, tableValue, operator, conditions }) => {
            if (conditions) {
                return flattenValues(conditions);
            }
            if (tableValue || operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
                return [];
            }
            if (operator.toUpperCase() === 'BETWEEN') {
                return value;
            }
            return value;
        });
    };
    const values = flattenValues(whereCondition);

    return { query: ` WHERE ${whereClauses}`, values };
};
