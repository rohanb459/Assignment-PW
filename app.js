const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;
const usersDbSource = "usersDb.db";
const employeesDbSource = "employees.db";
const auth = require("./middleware");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const port = 3004;

let userDb = new sqlite3.Database(usersDbSource, (err) => {
  if (err) {
    console.log(err.message);
    throw err;
  }
});

let employeeDb = new sqlite3.Database(employeesDbSource, (err) => {
  if (err) {
    console.log(err.message);
    throw err;
  }
});

app.get("/test", (req, res) => {
  res.json("ok");
});

// route for login
app.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  const userQuery = "SELECT * FROM users WHERE username = ?";

  userDb.get(userQuery, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      // User not found
      return res.status(401).json({ error: "User not found" });
    }

    // User found, check the password
    const passOk = bcrypt.compareSync(password, row.password);
    if (passOk) {
      // Password matches
      jwt.sign({ username }, jwtSecret, {}, (err, token) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        } else {
          res.cookie("token", token, {}).status(201).json({
            token,
          });
          console.log(token);
        }
      });
      // res.status(200).json({ message: 'Login successful' });
    } else {
      // Password doesn't match
      res.status(401).json({ error: "Invalid password" });
    }
  });
});

// route for new user registration
app.post("/register", express.json(), (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

  // Query the database to check if the user already exists
  const userQuery = "SELECT COUNT(*) as count FROM users WHERE username = ?";

  userDb.get(userQuery, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count > 0) {
      // User already exists
      return res.status(409).json({ error: "User already exists" });
    }

    // User does not exist; insert the new user into the database
    const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
    userDb.run(insertQuery, [username, hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Registration successful" });
    });
  });
});

// api to add a new record
app.post("/add-record", auth.authenticateToken, (req, res) => {
  const newEmployee = req.body;
  let { name, salary, currency, on_contract, department, sub_department } =
    newEmployee;
  if (on_contract === undefined) on_contract = "false";

  const insertQuery = `
    INSERT INTO employees (name, salary, currency, on_contract, department, sub_department)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  employeeDb.run(
    insertQuery,
    [name, salary, currency, on_contract, department, sub_department],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Error adding employee" });
      }
      res.status(201).json({
        message: "Employee added successfully",
        employee: newEmployee,
      });
    }
  );
});

app.delete("/delete-record", auth.authenticateToken, (req, res) => {
  const existingEmployee = req.body;
  const { name, department, sub_department } = existingEmployee;

  const employeeQuery =
    "SELECT COUNT(*) as count FROM employees WHERE name = ? AND department = ? AND sub_department = ?";

  employeeDb.get(
    employeeQuery,
    [name, department, sub_department],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row.count > 0) {
        // employee found
        employeeDb.run(
          "DELETE FROM employees WHERE name = ? AND department = ? AND sub_department = ?",
          [name, department, sub_department],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Error while deleting employee" });
            }
            res.status(200).json({ message: "Employee deleted successfully" });
          }
        );
      } else {
        res.status(400).json({ error: "Employee not found" });
      }
    }
  );
});

app.get("/salary-stats/", auth.authenticateToken, async (req, res) => {
  const targetCurrency = "INR"; // Target currency
  let totalSalary = 0;
  let minSalary = Infinity;
  let maxSalary = -Infinity;
  try {
    const employees = await new Promise((resolve, reject) => {
      employeeDb.all("SELECT * FROM employees", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    for (const employee of employees) {
      let exchangeRate = 1;
      if (employee.currency === "EUR") exchangeRate = 87;
      else if (employee.currency === "USD") exchangeRate = 83;

      // Convert the salary to the target currency
      const convertedSalary = exchangeRate * employee.salary;

      totalSalary += convertedSalary;
      minSalary = Math.min(minSalary, convertedSalary);
      maxSalary = Math.max(maxSalary, convertedSalary);
    }

    const meanSalary = totalSalary / employees.length;

    res
      .status(200)
      .json({ message: "converted in INR", minSalary, maxSalary, meanSalary });
  } catch (error) {
    console.error("Error fetching employee data:", error);
    res.status(500).json({ error: "Error fetching employee data" });
  }
});

app.get(
  "/salary-stats/on_contract",
  auth.authenticateToken,
  async (req, res) => {
    const targetCurrency = "INR"; // Target currency
    let totalSalary = 0;
    let minSalary = Infinity;
    let maxSalary = -Infinity;
    try {
      const employees = await new Promise((resolve, reject) => {
        employeeDb.all(
          `SELECT * FROM employees WHERE on_contract='true'`,
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });

      for (const employee of employees) {
        let exchangeRate = 1;
        if (employee.currency === "EUR") exchangeRate = 87;
        else if (employee.currency == "USD") exchangeRate = 83;

        // Convert the salary to the target currency
        const convertedSalary = exchangeRate * employee.salary;

        totalSalary += convertedSalary;
        minSalary = Math.min(minSalary, convertedSalary);
        maxSalary = Math.max(maxSalary, convertedSalary);
      }

      const meanSalary = totalSalary / employees.length;

      res.status(200).json({
        message: "converted in INR",
        minSalary,
        maxSalary,
        meanSalary,
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({ error: "Error fetching employee data" });
    }
  }
);

app.get(
  "/department-salary-stats",
  auth.authenticateToken,
  async (req, res) => {
    let statistics = [];

    try {
      const departments = await new Promise((resolve, reject) => {
        employeeDb.all(
          "SELECT DISTINCT department FROM employees",
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });
      for (const department of departments) {
        const departmentName = department.department;

        const employees = await new Promise((resolve, reject) => {
          employeeDb.all(
            "SELECT * FROM employees WHERE department = ?",
            [departmentName],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            }
          );
        });
        let totalSalary = 0;
        let minSalary = Infinity;
        let maxSalary = -Infinity;

        for (const employee of employees) {
          let exchangeRate = 1;
          if (employee.currency === "EUR") exchangeRate = 87;
          else if (employee.currency === "USD") exchangeRate = 83;

          // Convert the salary to the target currency
          const convertedSalary = exchangeRate * employee.salary;

          totalSalary += convertedSalary;
          minSalary = Math.min(minSalary, convertedSalary);
          maxSalary = Math.max(maxSalary, convertedSalary);
        }

        const meanSalary = totalSalary / employees.length;
        statistics.push({
          departmentName,
          minSalary,
          maxSalary,
          meanSalary,
        });
      }

      res.status(200).json(statistics);
    } catch (error) {
      console.error("Error fetching department data:", error);
      res.status(500).json({ error: "Error fetching department data" });
    }
  }
);

app.get(
  "/sub_department-salary-stats",
  auth.authenticateToken,
  async (req, res) => {
    let statistics = [];

    try {
      const departments = await new Promise((resolve, reject) => {
        employeeDb.all(
          "SELECT DISTINCT department FROM employees",
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });

      for (const department of departments) {
        const departmentName = department.department;

        const departmentEmployees = await new Promise((resolve, reject) => {
          employeeDb.all(
            "SELECT DISTINCT sub_department FROM employees WHERE department = ?",
            [departmentName],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            }
          );
        });

        for (const departmentEployee of departmentEmployees) {
          const subDepartmentName = departmentEployee.sub_department;
          const subDepartmentEmployees = await new Promise(
            (resolve, reject) => {
              employeeDb.all(
                "SELECT * FROM employees WHERE sub_department = ?",
                [subDepartmentName],
                (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows);
                }
              );
            }
          );

          let totalSalary = 0;
          let minSalary = Infinity;
          let maxSalary = -Infinity;

          for (const subDepartmentEmployee of subDepartmentEmployees) {
            let exchangeRate = 1;
            if (subDepartmentEmployee.currency === "EUR") exchangeRate = 87;
            else if (subDepartmentEmployee.currency === "USD") exchangeRate = 83;

            // Convert the salary to the target currency
            const convertedSalary = exchangeRate * subDepartmentEmployee.salary;

            totalSalary += convertedSalary;
            minSalary = Math.min(minSalary, convertedSalary);
            maxSalary = Math.max(maxSalary, convertedSalary);
          }
          const meanSalary = totalSalary / subDepartmentEmployees.length;
          statistics.push({
            departmentName,
            subDepartmentName,
            minSalary,
            maxSalary,
            meanSalary,
          });
        }

        
        
      }
      res.status(200).json(statistics);
    } catch (error) {
      console.error("Error fetching department data:", error);
      res.status(500).json({ error: "Error fetching department data" });
    }
  }
);

app.listen(port, () => console.log(`Listening on port ${port}`));
