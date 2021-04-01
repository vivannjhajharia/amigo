var express = require('express');
var router = express.Router();
const {
  body,
  validationResult
} = require('express-validator');
var userinfo = require('./users');
var passport = require('passport');
var passportLocal = require('passport-local');
var multer = require('multer');
var postinfo = require('./posts');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

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

var upload = multer({
  storage: storage
})

var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    var fileName = file.originalname;
    cb(null, fileName)
  }
})

var upload2 = multer({
  storage: storage2
})

router.post('/uploadpic', upload.single('dp'), function (req, res) {
  let address = '/images/uploads/' + req.file.filename;
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (userfound) {
      userfound.dp = address;
      userfound.save();
    })
    .then(function () {
      res.redirect('/profile')
    })
});

router.post('/createpost', upload2.single('image'), function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      postinfo.create({
          image: req.file.filename,
          caption: req.body.caption,
          user: founduser
        })
        .then(function (createdpost) {
          founduser.posts.push(createdpost);
          founduser.save();
          console.log(createdpost)
        })
        .then(function (a) {
          res.redirect('/profile')
        })
    })
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/register', function (req, res) {
  res.render('register');
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.get('/timeline', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      postinfo.find().populate('user')
        .exec(function (e, allposts) {
          console.log(allposts)
          res.render('timeline', {
            allposts,
            founduser
          })
        });
    })
});

router.get('/profile', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    }).populate('posts')
    .exec(function (e, founduser) {
      res.render('profile', {
        founduser,
        editable: true,
        loggedInUser: false
      })
    });
});

router.get('/postnow', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      res.render('postnow', {
        founduser
      });
    })
    .catch(function (e) {
      console.log(e)
    });
});

router.get('/editprofile', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      res.render('editprofile', {
        founduser
      });
    })
});

router.get('/search', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      res.render('search', {
        founduser
      });
    })
});

router.get('/searchprofile', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      res.render('searchprofile', {
        founduser
      });
    })
});

router.post('/register', body('username').custom(function (a) {
  return userinfo.findOne({
      username: a
    })
    .then(function (founduser) {
      if (founduser) {
        return Promise.reject('Username Already Exists')
      }
    })
}), body('password').isLength({
  min: 4
}).withMessage('Password Must Be 4 or More Digits Long'), body('password2').custom(function (b, {
  req
}) {
  if (b !== req.body.password) {
    return Promise.reject('Passwords Do Not Match')
  }
  return true
}), function (req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('register', {
      errors: errors.array()
    })
  }

  var infowithoutpswrd = new userinfo({
    username: req.body.username,
    email: req.body.email
  })
  userinfo.register(infowithoutpswrd, req.body.password)
    .then(function (a) {
      passport.authenticate('local')(req, res, function () {
          res.redirect('/timeline')
        })
        .catch(function (e) {
          console.log(e)
        })
    })
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/timeline',
  failureRedirect: '/'
}), function (req, res) {});

router.get('/find', function (req, res) {
  userinfo.find()
    .then(function (a) {
      res.send(a)
    })
});

router.get('/logout', function (req, res) {
  req.logOut();
  res.redirect('/')
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/')
  }
}

router.post('/update', isLoggedIn, function (req, res) {
  let updated = {
    bio: req.body.bio
  }
  userinfo.findOneAndUpdate({
      username: req.session.passport.user
    }, {
      $set: updated
    }, {
      new: true
    })
    .then(function (a) {
      res.redirect('profile')
    })
});

router.post('/searchprofile', isLoggedIn, function (req, res) {
  let typedvalue = req.body.username
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      userinfo.find({
          username: new RegExp(req.body.username)
        })
        .then(function (searcheduser) {
          res.render('searchprofile', {
            searcheduser,
            founduser,
            typedvalue,
            editable: false
          })
        });
    })
});

router.get('/profile/:username', isLoggedIn, function (req, res) {
  // let loggedInUser = req.session.passport.user;
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (loggedInUser) {
      userinfo.findOne({
          username: req.params.username
        }).populate('posts')
        .exec(function (e, founduser) {
          if (founduser.username == req.session.passport.user) {
            res.render('profile', {
              founduser,
              loggedInUser,
              editable: true
            })
          } else {
            res.render('profile', {
              founduser,
              loggedInUser,
              editable: false
            })
          }
        })
    })
});

router.get('/likes/:id', isLoggedIn, function (req, res) {
  postinfo.findOne({
      _id: req.params.id
    })
    .then(function (post) {
      if (post.likes.indexOf(req.session.passport.user) === -1) {
        post.likes.push(req.session.passport.user);
        post.save()
          .then(function (postsave) {
            res.redirect(req.headers.referer)
          })
      } else {
        res.redirect(req.headers.referer)
      }
    })
});

router.get('/forgot', function (req, res) {
  res.render('forgot')
});

router.post('/forgot', function (req, res) {
  crypto.randomBytes(30, function (e, token) {
    var resetToken = token.toString('hex');
    userinfo.findOne({
        email: req.body.email
      })
      .then(function (founduser) {
        if (!founduser) {
          res.redirect('/forgot')
        } else {
          founduser.resetToken = resetToken;
          founduser.resetTime = Date.now() + 8640000;
          founduser.save()
            .then(function () {
              let transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'vivannj@gmail.com',
                  pass: 'vj241005'
                }
              });
              let info = {
                from: 'Amigo',
                to: req.body.email,
                subject: 'Reset Your Password',
                text: 'Click the link to reset your password http://' + req.headers.host + '/reset/' + resetToken
              }
              transport.sendMail(info, function (e) {
                if (e) {
                  res.send(e)
                } else {
                  res.render('mailsent')
                }
              })
            })
        }
      })
  })
});

router.get('/newpassword', function (req, res) {
  res.render('newpassword')
});

router.get('/reset/:token', function (req, res) {
  userinfo.findOne({
      resetToken: req.params.token
    })
    .then(function (founduser) {
      var currentTime = Date.now();
      if (founduser.resetToken === req.params.token) {
        res.render('newpassword', {
          token: req.params.token
        })
      } else {
        res.send('error')
      }
    })
    .catch(function (e) {
      console.log(e)
    })
});

router.post('/resetpassword/:token', function (req, res) {
  userinfo.findOne({
      resetToken: req.params.token
    })
    .then(function (founduser) {
      founduser.setPassword(req.body.password, function (e) {
        founduser.resetToken = undefined,
          founduser.resetTime = undefined
        founduser.save()
          .then(function () {
            req.login(founduser, function (e) {
              res.redirect('/timeline')
            })
          })
      })
    })
});

router.get('/mailsent', function (req, res) {
  res.render('mailsent')
});

router.get('/chat', isLoggedIn, function (req, res) {
  userinfo.findOne({
      username: req.session.passport.user
    })
    .then(function (founduser) {
      res.render('chat', {
        founduser
      })
    })
});

module.exports = router;