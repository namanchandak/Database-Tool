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

const join = async (req, res) => {


    try {
        
        const { joinsHere } = req.body;
        const selectColumns = joinsHere.map(join => join.selectColumns).flat();


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
        const connection = await pool.getConnection();
        const query = `select ${selectColumnsString} from  ${joinQuery}`

        try {
            console.log('Executing Query:', query);
            const [results] = await connection.execute(query);
            res.json(results);
        } finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error in join:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}

module.exports = { join }