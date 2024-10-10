const pool = require('../config/config');

const getDataType = async (columnItem) => {
  let dataTypeQuery = `SELECT DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = '${columnItem[0]}' AND COLUMN_NAME = '${columnItem[1]}' AND TABLE_SCHEMA = '${process.env.database}';`;

  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute(dataTypeQuery);
    const dataType = results[0].DATA_TYPE;
    return dataType;
  } catch (error) {
    
};
}

const getKeys = async (req, res) => {
  if (!req.body.columnItem || req.body.columnItem < 2) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: "Missing columnItem" });
  } else if ((await getDataType(req.body.columnItem)) != "json") {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Table datatype is not type JSON",
    });
  }
  let aggregrate;
  for (let index = 1; index < req.body.columnItem.length; index++) {
    aggregrate += req.body.columnItem[index];
    aggregrate += ".";
  }

  let query = `SELECT ${req.body.columnItem[1]} FROM ${req.body.columnItem[0]} limit 1`;
  const connection = await pool.getConnection();
  const [jsonDataStructure] = await connection.query(query );

  console.log(query)
  res.json(jsonDataStructure[0]);

};

const getValue = async (req, res) => {
  const keys = Object.keys(req.body);
  res.json(keys);
};

module.exports = { getKeys, getValue };
