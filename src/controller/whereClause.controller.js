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
            // Function to recursively build the WHERE clause
            const buildWhereClause = (conds) => {
                return conds.map(({ logic, field, operator, value, conditions }, index) => {
                    if (conditions) {
                        // Recursively handle nested conditions with parentheses
                        const nestedClause = buildWhereClause(conditions);
                        return index > 0 ? `${logic} (${nestedClause})` : `(${nestedClause})`;
                    }

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
            };

            // Build the WHERE clause
            const whereClauses = buildWhereClause(conditions);

            // Flatten the values for the prepared statement
            const flattenValues = (conds) => {
                return conds.flatMap(({ value, operator, conditions }) => {
                    if (conditions) {
                        return flattenValues(conditions);
                    }
                    if (operator === 'BETWEEN') {
                        return value; // Return both lower and upper bound for BETWEEN
                    }
                    return value;
                });
            };
            const values = flattenValues(conditions);

            // Construct the complete query
            const query = `SELECT * FROM \`${tableName}\` WHERE ${whereClauses}`;

            // Log the final query for debugging
            console.log('Executing Query:', query, 'with Values:', values);

            // Execute the query
            const [rows] = await connection.execute(query, values);

            // Send the query result as the response
            res.json(rows);
        } finally {
            // Release the connection back to the pool
            connection.release();
        }
    } catch (error) {
        // Log the error for debugging
        console.error('Error executing query:', error.message);

        // Send the error message as the response
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

module.exports = { whereClause };
