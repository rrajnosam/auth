//REQUIRE PACKAGES
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//INITIALIZE PACKAGES
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(session({
  secret:"our little secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session())
;
//INITIALIZE DATABASE
mongoose.connect("mongodb://localhost:27017/UserDB", {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//--------------------ROUTES---------------------------

console.log(process.env.SECRET);

app.get("/",function(req,res){
  res.render("home.ejs");
});

// app.get("/auth/google", function(req,res){
//   passport.authenticate("google",{ scope: ["profile"] });
// });
app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secret",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/secrets", function(req,res){
  User.find({secret:{$ne:null}}, function(err, foundSecrets){
    if (err){
      console.log(err);
    } else {
      if (foundSecrets){
        res.render("secrets.ejs", {foundSecrets:foundSecrets});
      }
    }
  })
});

app.get("/submit",function(req,res){
  if (req.isAuthenticated()){
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }

});

app.post("/submit", function(req,res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function(err, foundId){
    if (err){
      console.log(err);
    } else {
      if (foundId){
        foundId.secret = submittedSecret;
        foundId.save();
        res.redirect("/secrets");
      }
    }
  });
});

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/register", function(req,res){
  res.render("register.ejs");
});

app.post("/register", function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});
















// START SERVER

app.listen(3000,function(){
  console.log("server started on port 3000");
});
