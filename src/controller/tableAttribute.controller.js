const pool = require("../config/config");

const getTable = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // console.log('Executing Query:', query, 'With Values:', values);
    const results = await connection.execute("show tables");

    const tableNames = results[0].map(row => row["Tables_in_test"]);
    res.status(200).json(tableNames);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  } finally {
    connection.release();
  }
};
const getColumn = async (req, res) => {
    const table = req.body.table
    const connection = await pool.getConnection();

  try {
    // console.log('Executing Query:', query, 'With Values:', values);
    const results = await connection.execute(`SHOW COLUMNS FROM ${table}`);

    const columnName = results[0].map(row => row["Field"]) ;
    res.status(200).json(columnName);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  } finally {
    connection.release();
  }
};
module.exports = { getTable, getColumn };
