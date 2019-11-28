var mysql = require("mysql");
var db_conf = {
	connectionLimit : 800,
    host     : "localhost",
	user     : "root",
	password : "",
	database : "event"
};

var pool = null;
function getPool() {
    if (pool === null) {
        pool = mysql.createPool(db_conf);
    } 
    return pool;
}
module.exports = getPool();