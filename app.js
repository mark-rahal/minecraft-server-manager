var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var EC2 = require('aws-sdk/clients/ec2');
var metadata = require('./metadata');
var minecraftPing = require('minecraft-ping')

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

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

function stopServerIfEmpty() {
  console.log('Checking player count...');
  minecraftPing.ping_fe01fa({ host: metadata.serverIP, port: 25565 }, (err, response) => {
    if (err) {
      return;
    }
    console.log('Players online: ' + response.playersOnline);
    if (response.playersOnline === 0) {
      var ec2 = new EC2({
        apiVersion: '2016-04-01',
        region: 'us-west-1'
      });

      ec2.stopInstances({ InstanceIds: [metadata.instanceId] }).promise().then(function(data) {
        console.log("No players online, stopping server.");
      }).catch(function(err) {
        console.log(err.message);
      });
    }
  })
}

setInterval(stopServerIfEmpty, metadata.shutdownCheckInterval);

module.exports = app;
