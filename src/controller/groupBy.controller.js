

const groupBy = async (req, res) => {
    try {
        let query = `group by`
        let { groupBy } = req.body;
        for (let i = 0; i < groupBy.length; i++) {
            let { table } = groupBy[i];
            if (!table ) {
                throw new Error('Missing required field(s) in order by configuration');
            }
            query += ` ${table} ,`
            if(i ===  groupBy.length - 1){
                query = query.slice(0, -1);
            }
        }
        return query
    } catch (error) {
        console.error('Error in join:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}

module.exports = { groupBy }