const pool = require('../config/config');

const whereClause = async (req, res) => {
    const { tableName, conditions } = req.body;

    if (!tableName || !conditions || !Array.isArray(conditions)) {
        return res.status(400).json({ error: 'Table name and conditions are required' });
    }

    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        try {
            // Construct the WHERE clause
            const whereClauses = conditions.map(({ field, operator, value }) => {
                if (!field || !operator || value === undefined) {
                    throw new Error('Invalid condition format');
                }
                return `${field} ${operator} ?`;
            }).join(' AND ');

            const values = conditions.map(condition => condition.value);

            // Construct the complete query
            const query = `SELECT * FROM \`${tableName}\` WHERE ${whereClauses}`;

            // Execute the query
            const [rows] = await connection.execute(query, values);

            // Send the query result as the response
            res.json(rows);
        } finally {
            // Release the connection back to the pool
            connection.release();
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { whereClause };
