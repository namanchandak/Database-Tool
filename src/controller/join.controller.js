const pool = require("../config/config");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config/dbconfig.json");
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (err) {
  console.error("Error reading config file:", err);
}

const join = async (req, res) => {
  try {
    const { joinsHere, selectColumns } = req.body;
    if (!selectColumns || !Array.isArray(selectColumns)) {
      throw new Error("Missing or invalid required field: selectColumns");
    }
    if (!config) {
      throw new Error("Configuration not loaded correctly");
    }
    const tableNames = Array.from(
      new Set(selectColumns.map((col) => col.split(".")[0]))
    );
    if (!tableNames.length) {
      throw new Error("No valid table names found in selectColumns");
    }
    let query = `select ${selectColumns} from `;
    let joinClause = "";
    for (let i = 0; i < joinsHere.length; i++) {
      const { table1, table2, joinType } = joinsHere[i];
      if (!table1 || !table2 || !joinType) {
        throw new Error("Missing required field(s) in join configuration");
      }
      const [table1Name, attribute1Name] = table1.split(".");
      const [table2Name, attribute2Name] = table2.split(".");
      if (i === 0) {
        joinClause += ` ${table1Name} ${joinType} ${table2Name} ON ${table1} = ${table2} `;
      } else {
        joinClause += ` ${joinType} ${table2Name} ON ${table1} = ${table2} `;
      }
    }
    query += joinClause;
    console.log(query, "\n", joinsHere, "\n", joinClause);
    const connection = await pool.getConnection();
    try {
      console.log("Executing Query:", query);
      const [results] = await connection.execute(query);
      res.json(results);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in join:", error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

const commonAttribute = async (req, res) => {
  //
  try {
    table1 = req.body.table1;
    table2 = req.body.table2;

    let commonAttribute = config.tables[table1][table2]

    // console.log(, "\n", table1, "\n", table2);
    res.json(Object.keys(commonAttribute));
  } catch (error) {
    console.error("Error in join:", error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

module.exports = { join, commonAttribute };
