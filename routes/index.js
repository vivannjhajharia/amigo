var express = require('express');
var router = express.Router();
const { body, validationResult } = require('express-validator');
var userinfo = require('./users');
var passport = require('passport');
var passportLocal = require('passport-local');
var multer = require('multer');
var postinfo = require('./posts');

passport.use(new passportLocal(userinfo.authenticate()));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    var fileName = file.originalname;
    cb(null, fileName)
  }
})
 
var upload = multer({ storage: storage })

var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    var fileName = file.originalname;
    cb(null, fileName)
  }
})
 
var upload2 = multer({ storage: storage2 })

router.post('/uploadpic', upload.single('dp'), function(req, res) {
  let address = '/images/uploads/' + req.file.filename;
  userinfo.findOne({
    username: req.session.passport.user
  })
  .then(function(userfound) {
    userfound.dp = address;
    userfound.save();
  })
  .then(function() {
    res.redirect('/profile')
  })
});

router.post('/createpost', upload2.single('image'), function(req, res) {
  userinfo.findOne({
    username: req.session.passport.user
  })
  .then(function(founduser) {
    postinfo.create({
      image: req.file.filename,
      caption: req.body.caption,
      user: founduser
    })
    .then(function(createdpost) {
      founduser.posts.push(createdpost);
      founduser.save();
      console.log(createdpost)
    })
    .then(function(a) {
      res.redirect('/profile')
    })
  })
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/register', function(req, res) {
  res.render('register');
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.get('/timeline', isLoggedIn, function(req, res) {
  postinfo.find().populate('socialmedia')
  .exec(function(e, allposts) {
    console.log(allposts)
    res.render('timeline', {allposts})
  });
});

router.get('/profile', isLoggedIn, function(req, res) {
  userinfo.findOne({username: req.session.passport.user}).populate('posts')
  .exec(function(e, founduser) {
    res.render('profile', {founduser})
  });
});

router.get('/postnow', isLoggedIn, function(req, res) {
  userinfo.findOne({username: req.session.passport.user})
  .then(function(founduser) {
    res.render('postnow', {founduser});
  })
});

router.get('/editprofile', isLoggedIn, function(req, res) {
  userinfo.findOne({username: req.session.passport.user})
  .then(function(founduser) {
    res.render('editprofile', {founduser});
  })
});

router.get('/search', isLoggedIn, function(req, res) {
  userinfo.findOne({username: req.session.passport.user})
  .then(function(founduser) {
    res.render('search', {founduser});
  })
});

router.get('/searchprofile', isLoggedIn, function(req, res) {
  userinfo.findOne({username: req.session.passport.user})
  .then(function(founduser) {
    res.render('searchprofile', {founduser});
  })
});

router.post('/register', function(req, res) {
  var infowithoutpswrd = new userinfo({
    username: req.body.username,
    email: req.body.email
  })
  userinfo.register(infowithoutpswrd, req.body.password)
  .then(function(a){
    passport.authenticate('local')(req, res, function(){
      res.redirect('/timeline')
    })
  })
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/timeline', 
  failureRedirect: '/'
}), function(req, res) {});

router.get('/find', function(req, res) {
  userinfo.find()
  .then(function(a) {
    res.send(a)
  })
});

router.get('/logout', function(req, res) {
  req.logOut();
  res.redirect('/')
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) {
    return next()
  }
  else {
    res.redirect('/')
  }
}

router.post('/update', isLoggedIn, function(req, res) {
  let updated = {
    bio: req.body.bio
  }
  userinfo.findOneAndUpdate({username: req.session.passport.user}, {$set:updated}, {new:true})
  .then(function(a) {
    res.redirect('profile')
  })
});

module.exports = router;
