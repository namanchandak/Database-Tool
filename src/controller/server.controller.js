const getServer = async (req, res) =>{
    res.send("Server is on port 8080!");
}

module.exports = {getServer}