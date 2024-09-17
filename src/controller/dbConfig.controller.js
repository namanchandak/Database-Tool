const fs = require('fs').promises;
const path = require('path');
let dbData = require('../config/testDbConfig.json');

const dbConfigGet = async (req, res) => {
  try {
    if (!req.body.table) {
      return res.status(200).json(dbData);
    }

    if (!dbData.tables[req.body.table]) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'No Table Found'
      });
    }

    return res.status(200).json(dbData.tables[req.body.table]);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

const dbConfigPost = async (req, res) => {
  try {
    if (!req.body || !req.body.table1 || !req.body.table2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Table names are required'
      });
    }

    
    let dbData = await getDbData();
    
    if (!dbData.tables[req.body.table1]) {
        dbData = await addTable(req.body.table1);
    }
    
    if (!dbData.tables[req.body.table2]) {
        dbData = await addTable(req.body.table2);
    }
    
    let mapFound = -1
    //insert in table 1
    //common attribute check
    for (let index = 0; index < dbData.tables[req.body.table1].length; index++) {
        const element = dbData.tables[req.body.table1][index].table;
        // console.log(element, " hi i am namann\n")

        if(dbData.tables[req.body.table1][index].table == req.body.table2)
        {
            mapFound = index;
            break;
        }
    }
    // console.log(mapFound, " hi i am inde\n")
    if(mapFound !== -1)
    {
        //if already exist condition ignored
        for (let index = 0; index < req.body.commonAttributes.length; index++) {
            const element = req.body.commonAttributes[index];
            dbData.tables[req.body.table1][mapFound].commonAttributes[element] = ""           
        }
    }
    else
    {
        dbData.tables[req.body.table1].push({ "table": req.body.table2, "commonAttributes": req.body.commonAttributes })
        dbData.tables[req.body.table2].push({ "table": req.body.table1, "commonAttributes": req.body.commonAttributes })
    }

    ///////insert in table2

    mapFound = -1
    for (let index = 0; index < dbData.tables[req.body.table2].length; index++) {
        const element = dbData.tables[req.body.table2][index].table;
        console.log(element)

        if(dbData.tables[req.body.table2][index].table == req.body.table1)
        {
            mapFound = index;
            break;
        }
    }
    //found
    if(mapFound !== -1)
    {
        //if already exist condition ignored
        for (let index = 0; index < req.body.commonAttributes.length; index++) {
            const element = req.body.commonAttributes[index];
            dbData.tables[req.body.table2][mapFound].commonAttributes[element] = ""   
        }
    }
    else
    {
        dbData.tables[req.body.table1].push({ "table": req.body.table2, "commonAttributes": req.body.commonAttributes })
        dbData.tables[req.body.table2].push({ "table": req.body.table1, "commonAttributes": req.body.commonAttributes })
    }


    console.log(dbData.tables[req.body.table2])
    updateTable(dbData)

    return res.status(200).json(dbData.tables[req.body.table1]);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

async function updateTable(JsonData) {
    const filePath = path.resolve(__dirname, '../config/testDbConfig.json');
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const json = JSON.parse(data);

        
        // json.tables[table] = [{}];
        await fs.writeFile(filePath, JSON.stringify(JsonData, null, 2));
        console.log('File updated successfully');
        return json;
         
    } catch (err) {
        console.error('Error updating file:', err);
        throw err;
    }
}

async function addTable(table) {
  const filePath = path.resolve(__dirname, '../config/testDbConfig.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(data);

    if (typeof json.tables === 'object') {
      json.tables[table] = [];
      await fs.writeFile(filePath, JSON.stringify(json, null, 2));
      console.log('File updated successfully');
      return json;
    } else {
      throw new Error('Invalid format: json.tables is not an object');
    }
  } catch (err) {
    console.error('Error updating file:', err);
    throw err;
  }
}

async function getDbData() {
  const filePath = path.resolve(__dirname, '../config/testDbConfig.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading or parsing file:', err);
    throw err;
  }
}

module.exports = { dbConfigGet, dbConfigPost };
