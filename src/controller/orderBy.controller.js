

const orderBy = async (req, res) => {
    try {
        let query = `order by`
        let { orderBy } = req.body;
        for (let i = 0; i < orderBy.length; i++) {
            let { table, type } = orderBy[i];
            if (!table || !type) {
                throw new Error('Missing required field(s) in order by configuration');
            }

            query += ` ${table} ${type} ,`

            if(i ===  orderBy.length - 1){
                query = query.slice(0, -1);
            }
        }
        return query
    } catch (error) {
        console.error('Error in join:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}

module.exports = { orderBy }