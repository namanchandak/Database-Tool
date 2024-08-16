
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
        let query = await joinTables(req);
        let values = [];
        if (req.body.whereCondition && Array.isArray(req.body.whereCondition)) {
            const whereResult = whereClause(req);
            query += whereResult.query;
            values = whereResult.values;
        }
        const connection = await pool.getConnection();

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
        const { joinsHere } = req.body;
        const selectColumns = joinsHere.map(join => join.selectColumns).flat();
        console.log("req" + joinsHere)


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


        const joinQuery = buildJoin(joinsHere);
        const selectColumnsString = selectColumns.join(', ');
        // const connection = await pool.getConnection();
        const query = `select ${selectColumnsString} from  ${joinQuery}`

        return query

        
    }
    catch (error) {
        console.error('Error in join:', error.message);
        res.status(500).json({ error: 'Internal Server Error 1', message: error.message });
    }
};

const buildJoin = (conds) => {
    return conds.map(({ joinType, table1, table2, conditions }, index) => {
        let clause = "";

        if (conditions) {
            const nestedClause = buildJoin(conditions);
            clause = `${nestedClause}`;
        }
        else {
            const [tableName, attributeName] = table2.split('.');

            clause += `${tableName}`
        }
        if (joinType) {
            const [tableName, attributeName] = table1.split('.');

            clause += ` ${joinType} ${tableName} ON ${table1} =  ${table2}`;
        }
        return clause;
    }).join(' ');
}




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

module.exports = { joinWithWhere };