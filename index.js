require('dotenv').config();

const express = require("express");
const app = express();
const url = require("url");
const path = require("path");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const MongoClient = require("mongodb").MongoClient;
const multer = require("multer");
const upload = multer();

app.use(express.json());
app.use(upload.array());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, "/views")));

const authorize = (req, res, next) => {
    const authToken = req.cookies.authToken;
    jwt.verify(authToken, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            res.redirect('/login');
        }

        req.user = user;
        next();
    });

};

app.get("/", authorize, (req, res) => {
    res.sendFile('views/home.html', {root: __dirname});
});

app.get("/login", (req, res) => {
    res.sendFile('views/login.html', {root: __dirname});
});

app.get("/signup", (req, res) => {
    res.sendFile('views/signup.html', {root: __dirname});
});

app.get("/logout", (req, res) => {
    res.cookie("authToken", "");
    res.redirect("/login");
});

app.post("/signup", (req, res) => {
    const dbUrl = "mongodb://localhost:27017/";
    MongoClient.connect(dbUrl, (err, db) => {
        let dbo = db.db("testDb");
        if (err) res.end("Database error");
        let userDat = {username : req.body.email, password : req.body.password};
        let userMail = {username : req.body.email};
        
        dbo.collection("users").findOne(userMail, (err, result) => {
            if (err) res.end("ERROR");
            
            if (result != null) {
                res.send("Already exists!");
                return;
            }

            dbo.collection("users").insertOne(userDat, (err, result) => {
                if (err) res.end("Some error occured!");
                
                const authToken = jwt.sign(userDat, process.env.SECRET_KEY);
                res.cookie("authToken", authToken);
                res.redirect("/");
            });
        });
    });
});

app.post("/login", (req, res) => {
    console.log(req.body);
    const dbUrl = "mongodb://localhost:27017/";
    MongoClient.connect(dbUrl, (err, db) => {
        let dbo = db.db("testDb");
        if (err) res.end("Database error");
        let userDat = {username : req.body.email, password: req.body.password};
        dbo.collection("users").findOne(userDat, (err, result) => {
            if (err) res.end("ERROR");
            
            if (result == null)
                res.send("Invalid username or password");
            else {
                const authToken = jwt.sign(userDat, process.env.SECRET_KEY);
                res.cookie("authToken", authToken);
                res.redirect("/");
            }
        });
    });
});

app.listen(3000);