const connection = require('../config/config');

const getJsonData = async (req, res) => {
    const { empId, detailType, specificField } = req.body;

    if (!empId || !detailType) {
        return res.status(400).send({ error: 'empId and detailType are required' });
    }

    try {
        let query;
        let selectFields = [];

        // Determine the SELECT fields based on the detailType and specificField
        if (detailType === 'all') {
            selectFields.push('jData');
        } else if (detailType === 'contact') {
            if (specificField === 'phone') {
                selectFields.push("JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.phone')) AS phone");
            } else if (specificField === 'email') {
                selectFields.push("JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.email')) AS email");
            } else {
                selectFields.push("JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.phone')) AS phone");
                selectFields.push("JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.email')) AS email");
            }
        } else if (detailType === 'name') {
            selectFields.push("JSON_UNQUOTE(JSON_EXTRACT(jData, '$.name')) AS name");
        } else {
            return res.status(400).send({ error: 'Invalid detailType provided' });
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

            // Handle data based on detailType
            if (detailType === 'all') {
                try {
                    // Log the raw data for debugging
                    console.log('Raw jData:', results[0].jData);

                    // Parse JSON data
                    responseData = JSON.parse(results[0].jData);
                } catch (error) {
                    console.error('Error parsing JSON data:', error.message);
                    return res.status(500).send({ error: 'Error parsing JSON data' });
                }
            } else if (detailType === 'contact') {
                // Create responseData based on available fields
                responseData = {};
                if (results[0].phone) responseData.phone = results[0].phone;
                if (results[0].email) responseData.email = results[0].email;
            } else if (detailType === 'name') {
                responseData = {
                    name: results[0].name
                };
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
