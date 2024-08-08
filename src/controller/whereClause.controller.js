const connection = require('../config/config');

const whereClause = async (req, res) => {
    const { tableName, condition } = req.body;

    if (!tableName || !condition) {
        return res.status(400).json({ error: 'Table name and condition are required' });
    }

    try {
        // Construct the WHERE clause
        const whereClauses = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
        const values = Object.values(condition);

        // Construct the complete query
        const query = `SELECT * FROM \`${tableName}\` WHERE ${whereClauses}`;

        // Execute the query
        const [rows] = await connection.execute(query, values);

        // Send the query result as the response
        res.json(rows);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.end();
        }
    }
};

module.exports = { whereClause };
