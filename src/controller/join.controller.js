
const buildJoin =  (conds) => {
    
    return conds.map(({  joinType, table1, table2, conditions }, index) => {
        let clause = "";

        if (conditions) {
            const nestedClause = buildJoin(conditions);
            // console.log(table1)
            clause =   `${nestedClause}`;
        }
        else{
            const [tableName, attributeName] = table2.split('.');

            clause += `${tableName}`
        }
        if (joinType) {
            const [tableName, attributeName] = table1.split('.');

            clause += ` ${joinType} ${tableName} ON ${table1} =  ${table2}`;
        } 
        // console.log(clause)

        return  clause;


    }).join(' ');
}

const join = async (req, res) => {

    const {joinsHere}  = req.body;
    
    const joinQuery =  buildJoin(joinsHere);

    const query = `select * from  ${joinQuery}`

    console.log(query)

    res.status(200).send('Req send successfully ' + query);

}

module.exports = { join }