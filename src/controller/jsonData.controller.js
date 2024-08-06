const connection = require('../config/config');

const getJsonData = async (req, res) => {
    const { empId, detail } = req.body;

    if (!empId) {
        return res.status(400).send({ error: 'empId is required' });
    }

    try {
        let query;
        let selectFields = [];

        // Determine the SELECT fields based on the detail
        if (detail) {
            // Ensure the detail path is correctly formatted for SQL
            const jsonPath = detail.startsWith('$.') ? detail : `$.${detail}`;
            selectFields.push(`JSON_UNQUOTE(JSON_EXTRACT(jData, '${jsonPath}')) AS detail`);
        } else {
            selectFields.push('jData');
        }

        // Construct the SQL query dynamically
        query = `SELECT ${selectFields.join(', ')} FROM empt WHERE empId = ?`;

        // Print the constructed query and parameters
        console.log('Executing Query:', query);
        console.log('With Parameter:', empId);

        // Execute the query with parameter binding
        const [results] = await connection.query(query, [empId]);

        if (results.length > 0) {
            let responseData;

            if (detail) {
                // If detail is requested, return it
                responseData = {
                    detail: results[0].detail
                };
            } else {
                // If no detail is requested, return the entire JSON data
                // Check if jData is an object, no need to parse
                const jData = results[0].jData;
                if (typeof jData === 'object') {
                    responseData = jData;
                } else if (typeof jData === 'string') {
                    try {
                        responseData = JSON.parse(jData);
                    } catch (error) {
                        console.error('Error parsing JSON data:', error.message);
                        return res.status(500).send({ error: 'Error parsing JSON data' });
                    }
                } else {
                    console.error('jData is not a valid type:', jData);
                    return res.status(500).send({ error: 'Unexpected data type for jData' });
                }
            }

            res.json(responseData);
        } else {
            res.status(404).send({ error: 'No data found' });
        }
    } catch (error) {
        console.error('Error executing query:', error.message);
        res.status(500).send({ error: 'An error occurred while fetching data' });
    }
};

module.exports = { getJsonData };
