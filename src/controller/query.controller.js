
const pool = require('../config/config');
const fs = require('fs');
const path = require('path');
const {orderBy} = require('./orderBy.controller');
const {groupBy} = require('./groupBy.controller');

const configPath = path.join(__dirname, '../config/dbconfig.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    console.error('Error reading config file:', err);
}

const queryFire = async (req, res) => {
    try {

        const {selectColumns } = req.body;
        if (!selectColumns || !Array.isArray(selectColumns)) {
            throw new Error('Missing or invalid required field: selectColumns');
        }
        if (!config) {
            throw new Error('Configuration not loaded correctly');
        }
        const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));
        if (!tableNames.length) {
            throw new Error('No valid table names found in selectColumns');
        }

        let query = `select ${selectColumns} from `
        query += await joinTables(req);
        let values = [];
        if (req.body.whereCondition && Array.isArray(req.body.whereCondition)) {
            const whereResult = whereClause(req);
            query += whereResult.query;
            values = whereResult.values;
        }
        // console.log(query)
        const connection = await pool.getConnection();

        if( req.body.groupBy != undefined && req.body.groupBy != '')
        {
            const groupByQuery = await groupBy(req)
            query += groupByQuery
        }
        if( req.body.orderBy != undefined && req.body.orderBy != '')
        {
            const orderByQuery = await orderBy(req)
            query += orderByQuery
        }


        try {
            console.log('Executing Query:', query, 'With Values:', values);
            const [results] = await connection.execute(query, values);
            res.json(results);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in joinWithWhere:', error.message);
        res.status(500).json({ error: 'Internal Server Error 2', message: error.message });
    }
};


const joinTables = async (req, res) => {
    try {   
        const { joinsHere,selectColumns } = req.body;
        if (!selectColumns || !Array.isArray(selectColumns)) {
            throw new Error('Missing or invalid required field: selectColumns');
        }
        if (!config) {
            throw new Error('Configuration not loaded correctly');
        }
        const tableNames = Array.from(new Set(selectColumns.map(col => col.split('.')[0])));
        if (!tableNames.length) {
            throw new Error('No valid table names found in selectColumns');
        }
        let joinClause = '';
        for (let i = 0; i < joinsHere.length; i++) {
            const { baseTable, table2, joinType } = joinsHere[i];
            if (!baseTable || !table2 || !joinType) {
                throw new Error('Missing required field(s) in join configuration');
            }
            const [baseTableName, attribute1Name] = baseTable.split('.');
            const [table2Name, attribute2Name] = table2.split('.');
            if (i === 0) {
                joinClause += ` ${baseTableName} ${joinType} ${table2Name} ON ${baseTable} = ${table2} `;
            } else {
                joinClause += ` ${joinType} ${table2Name} ON ${baseTable} = ${table2} `;
            }
        }
        return joinClause
    }
    catch (error) {
        console.error('Error in join:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
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
            clause = `${field} ${operator.toUpperCase()} ? AND ? `;
        } else if (operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
            clause = `${field} ${operator.toUpperCase()}`;
        } else {
            clause = `${field} ${operator.toUpperCase()} ? `;
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

module.exports = { queryFire };