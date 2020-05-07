//REQUIRE PACKAGES
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

//INITIALIZE PACKAGES
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

//INITIALIZE DATABASE
mongoose.connect("mongodb://localhost:27017/UserDB", {useNewUrlParser:true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

const User = new mongoose.model("user",userSchema);

//--------------------ROUTES---------------------------

console.log(process.env.SECRET);

app.get("/",function(req,res){
  res.render("home.ejs");
});

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.get("/register", function(req,res){
  res.render("register.ejs");
});

app.post("/register", function(req,res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if (!err){
      res.render("secrets.ejs");
    } else{
      console.log(err);
    }
  });
});

app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username}, function(err, foundUser){
    if(!err){
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets.ejs");
        }
      }
    } else {
      console.log(err);
    }
  });
});
















// START SERVER

app.listen(3000,function(){
  console.log("server started on port 3000");
});
