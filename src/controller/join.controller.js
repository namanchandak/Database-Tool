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
            // console.log(table1)
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
        // console.log(clause)

        return clause;


    }).join(' ');
}

const join = async (req, res) => {

    try {

        const { joinsHere } = req.body;

        const joinQuery = buildJoin(joinsHere);

        const selectColumns = joinsHere.map(join => join.selectColumns).flat();

        // Join the array elements into a single string
        const selectColumnsString = selectColumns.join(', ');

        // Now you can log or use the string
        // console.log(selectColumnsString); // Outputs: rcost.rId

        const connection = await pool.getConnection();

        const query = `select ${selectColumnsString} from  ${joinQuery}`

        // console.log(query)

        try {
            // Log the final query for debugging
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