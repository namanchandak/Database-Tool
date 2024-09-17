const dbData = require('../config/testDbConfig.json')

const dbConfigGet = async(req, res) =>{
    try {
        if( !req.body.table  )
        {
            console.log("dbConfigGet called")
            res.status(200).json(dbData);

        }
        else
        {
            console.log(dbData.tables[req.body.table], " \n" , req.body.table)
            res.status(200).json(  dbData.tables[req.body.table] );
        }
        
    } catch (error) {
        
    }
}

const dbConfigGetById = async(req, res) =>{
    try {
        res.status(200).json(dbData);
        
    } catch (error) {
        
    }
}
module.exports = { dbConfigGet }