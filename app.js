var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var expressSession = require('express-session');
var userinfo = require('./routes/users');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var socketIO = require('socket.io');

var app = express();

app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: 'abcd'
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(userinfo.serializeUser());
passport.deserializeUser(userinfo.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var io = socketIO();
app.io = io;

io.on('connection', function(socketuser) {
  // console.log('Connected')
  // console.log(socketuser.id)
  socketuser.on('chat', function(msg) {
    io.emit('chat2', msg)
  })
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
