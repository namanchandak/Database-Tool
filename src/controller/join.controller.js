
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

    const selectColumns = joinsHere.map(join => join.selectColumns).flat();

    // Join the array elements into a single string
    const selectColumnsString = selectColumns.join(', ');

    // Now you can log or use the string
    console.log(selectColumnsString); // Outputs: rcost.rId


    
    const query = `select ${selectColumnsString} from  ${joinQuery}`

    console.log(query)

    res.status(200).send('Req send successfully ' + query);

}

module.exports = { join }