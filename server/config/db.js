// const mysql = require("mysql2");

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",   // XAMPP password agar hai to yahan likhen
//   database: "car_rental_system"
// });

// db.connect(err => {
//   if (err) {
//     console.error("Database connection failed:", err);
//   } else {
//     console.log("MySQL Connected Successfully");
//   }
// });

// module.exports = db;

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || "localhost",
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "car_rental_system",
  ssl: process.env.MYSQLHOST ? { rejectUnauthorized: false } : undefined
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("MySQL Connected Successfully");
  }
});

module.exports = db;