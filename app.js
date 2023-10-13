const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const sqlite3 = require('sqlite3').verbose();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require('bcryptjs');
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;
const usersDbSource = "usersDb.db";
const auth = require('./middleware');

const port = 3004;

let db = new sqlite3.Database(usersDbSource, (err)=>{
    if(err)
    {
        console.log(err.message);
        throw err;
    }
})

app.get("/test", (req, res)=>{
    res.json("test ok");
})

// route for login
app.post('/login', express.json(), (req, res) => {
    const { username, password } = req.body;
  
    
    const userQuery = 'SELECT * FROM users WHERE username = ?';
  
    db.get(userQuery, [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      if (!row) {
        // User not found
        return res.status(401).json({ error: 'User not found' });
      }
  
      // User found, check the password
      const passOk = bcrypt.compareSync(password, row.password);
      if (passOk) {
        // Password matches
        jwt.sign(
            { username},
            jwtSecret,
            {},
            (err, token) => {
              res.cookie("token", token, { sameSite: "none", secure: true })
              .status(201)
              .json({
                    token
              });
              console.log(token);
            }
          );
        // res.status(200).json({ message: 'Login successful' });
      } else {
        // Password doesn't match
        res.status(401).json({ error: 'Invalid password' });
      }
    });
  });

  // route for new user registration
  app.post('/register', express.json(), (req, res) => {
    const { username, password } = req.body;
  
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    // Query the database to check if the user already exists
    const userQuery = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
  
    db.get(userQuery, [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      if (row.count > 0) {
        // User already exists
        return res.status(409).json({ error: 'User already exists' });
      }
  
      // User does not exist; insert the new user into the database
      const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
      db.run(insertQuery, [username, hashedPassword], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
  
        res.json({ message: 'Registration successful' });
      });
    });

  });
  
  
app.listen(port, ()=>console.log(`Listening on port ${port}`));