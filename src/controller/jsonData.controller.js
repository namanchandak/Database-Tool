const connection = require('../config/config');

const getJsonData = async (req, res) => {
    const { empId, detailType, specificField } = req.body;

    if (!empId || !detailType) {
        return res.status(400).send({ error: 'empId and detailType are required' });
    }

    try {
        let query;

        // Determine the query based on the detailType
        if (detailType === 'all') {
            query = 'SELECT jData FROM empt WHERE empId = ?';
        } else if (detailType === 'contact') {
            if (specificField === 'phone') {
                query = `
                    SELECT JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.phone')) AS phone 
                    FROM empt 
                    WHERE empId = ?`;
            } else if (specificField === 'email') {
                query = `
                    SELECT JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.email')) AS email 
                    FROM empt 
                    WHERE empId = ?`;
            } else {
                query = `
                    SELECT JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.phone')) AS phone, 
                           JSON_UNQUOTE(JSON_EXTRACT(jData, '$.contact.email')) AS email 
                    FROM empt 
                    WHERE empId = ?`;
            }
        } else if (detailType === 'name') {
            query = `
                SELECT JSON_UNQUOTE(JSON_EXTRACT(jData, '$.name')) AS name 
                FROM empt 
                WHERE empId = ?`;
        } else {
            return res.status(400).send({ error: 'Invalid detailType provided' });
        }

        // Print the constructed query and parameters
        console.log('Executing Query:', query);
        console.log('With Parameter:', empId);

        // Execute the query with parameter binding
        const [results] = await connection.query(query, [empId]);

        if (results.length > 0) {
            let responseData;

            // Handle data based on detailType
            if (detailType === 'all') {
                // Directly use the object if already parsed
                responseData = results[0].jData;
            } else if (detailType === 'contact') {
                if (specificField === 'phone') {
                    responseData = {
                        phone: results[0].phone
                    };
                } else if (specificField === 'email') {
                    responseData = {
                        email: results[0].email
                    };
                } else {
                    responseData = {
                        phone: results[0].phone,
                        email: results[0].email
                    };
                }
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
