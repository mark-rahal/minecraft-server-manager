var express = require('express');
var router = express.Router();
var EC2 = require('aws-sdk/clients/ec2');
var metadata = require('../metadata');
const mcPing = require('minecraft-ping');

// aws credentials set in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars
var ec2 = new EC2({
    apiVersion: '2016-04-01',
    region: 'us-west-1'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    ec2.describeInstanceStatus({ InstanceIds: [metadata.instanceId], IncludeAllInstances: true }).promise().then(function(data) {
        const instanceState = data.InstanceStatuses[0].InstanceState.Name;
        console.log(instanceState);
        if (instanceState === 'running') {
            // get players online
            // allow user to stop server
            mcPing.ping_fe01fa({ host: metadata.serverAddress, port: 25565 }, function(err, response) {
                console.log(err, response);
                res.render('index', { statusMsg: 'Server is running.', showStopButton: true, serverPing: JSON.stringify(response) });
            });
        } else if (instanceState === 'pending') {
            res.render('index', { statusMsg: 'Server is starting.' });
        } else if (instanceState === 'shutting-down') {
            res.render('index', { statusMsg: 'Server is stopping.' });
        } else if (instanceState === 'stopping') {
            res.render('index', { statusMsg: 'Server is stopping.' });
        } else if (instanceState === 'stopped') {
            // allow user to start server
            res.render('index', { statusMsg: 'Server is stopped.', showStartButton: true });
        }
    }).catch(function(err) {
        console.log(err.message);
        res.render('index', { status: 'Unable to get server status.' });
    });
});

router.get('/start', function(req, res, next) {
    console.log('starting server...');
    ec2.startInstances({ InstanceIds: [metadata.instanceId] }).promise().then(function(data) {
        res.redirect('/');
    }).catch(function(err) {
        console.log(err.message);
    });
});

router.get('/stop', function(req, res, next) {
    console.log('stopping server...');
    ec2.stopInstances({ InstanceIds: [metadata.instanceId] }).promise().then(function(data) {
        res.redirect('/');
    }).catch(function(err) {
        console.log(err.message);
        res.redirect('/');
    });
});

module.exports = router;
