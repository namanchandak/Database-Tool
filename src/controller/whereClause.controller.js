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
            const whereClauses = conditions.map(({ logic, field, operator, value }, index) => {
                if (!field || !operator || (operator === 'BETWEEN' && !Array.isArray(value)) || value === undefined) {
                    throw new Error('Invalid condition format');
                }

                let clause;
                if (operator === 'BETWEEN') {
                    clause = `${field} ${operator} ? AND ?`;
                } else {
                    clause = `${field} ${operator} ?`;
                }

                // Add logic operator (AND/OR) before each condition except the first one
                return index > 0 ? `${logic} ${clause}` : clause;
            }).join(' ');

            // Flatten the values for the prepared statement
            const values = conditions.flatMap(condition => {
                if (condition.operator === 'BETWEEN') {
                    return condition.value; // Return both lower and upper bound for BETWEEN
                }
                return condition.value;
            });

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
