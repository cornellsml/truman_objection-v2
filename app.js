/**
 * Module dependencies.
 */
const express = require('express');
const _ = require('lodash');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
var schedule = require('node-schedule');
const fs = require('fs');
const util = require('util');
fs.readFileAsync = util.promisify(fs.readFile);
const multer = require('multer');
var schedule = require('node-schedule');

var userpost_options = multer.diskStorage({
    destination: path.join(__dirname, 'uploads/user_post'),
    filename: function(req, file, cb) {
        var lastsix = req.user.id.substr(req.user.id.length - 6);
        var prefix = lastsix + Math.random().toString(36).slice(2, 10);
        cb(null, prefix + file.originalname.replace(/[^A-Z0-9]+/ig, "_"));
    }
});
var useravatar_options = multer.diskStorage({
    destination: path.join(__dirname, 'uploads/user_post'),
    filename: function(req, file, cb) {
        var prefix = req.user.id + Math.random().toString(36).slice(2, 10);
        cb(null, prefix + file.originalname.replace(/[^A-Z0-9]+/ig, "_"));
    }
});

const userpostupload = multer({ storage: userpost_options });
const useravatarupload = multer({ storage: useravatar_options });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const actorsController = require('./controllers/actors');
const scriptController = require('./controllers/script');
const userController = require('./controllers/user');
const notificationController = require('./controllers/notification');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
    console.error(err);
    //console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

/****
 **CRON JOBS
 **Check if users are still active every 8 hours (at 4:30am, 12:30pm, and 20:30pm)
 */
var rule1 = new schedule.RecurrenceRule();
rule1.hour = 4;
rule1.minute = 30;
var j = schedule.scheduleJob(rule1, function() {
    userController.stillActive();
});

var rule2 = new schedule.RecurrenceRule();
rule2.hour = 12;
rule2.minute = 30;

var j2 = schedule.scheduleJob(rule2, function() {
    userController.stillActive();
});

var rule3 = new schedule.RecurrenceRule();
rule3.hour = 20;
rule3.minute = 30;

var j3 = schedule.scheduleJob(rule3, function() {
    userController.stillActive();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(expressStatusMonitor());
//app.use(compression());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    rolling: false,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 7200000 //2 hours
    },
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
        autoReconnect: true,
        clear_interval: 3600
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//this allows us to not check CSRF when uploading an image. Its a weird issue that
//multer and lusca no not play well together
// app.use((req, res, next) => {
//     if ((req.path === '/post/new') || (req.path === '/account/profile') || (req.path === '/account/signup_info_post')) {
//         console.log("Not checking CSRF. Out path now");
//         next();
//     } else {
//         lusca.csrf()(req, res, next);
//     }
// });

//app.use(lusca.xframe('SAMEORIGIN'));
//allow-from https://example.com/
//add_header X-Frame-Options "allow-from https://cornell.qualtrics.com/";
//app.use(lusca.xframe('allow-from https://cornell.qualtrics.com/'));
// app.use(lusca.xssProtection(true));

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        req.path !== '/bell' &&
        req.path !== '/pageLog' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    }
    next();
});

var csrf = lusca({ csrf: true });

app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/semantic', express.static(path.join(__dirname, 'semantic'), { maxAge: 31557600000 }));
app.use(express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));
app.use('/post_pictures', express.static(path.join(__dirname, 'post_pictures'), { maxAge: 31557600000 }));
app.use('/profile_pictures', express.static(path.join(__dirname, 'profile_pictures'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', passportConfig.isAuthenticated, scriptController.getScript);

// app.post('/post/new', userpostupload.single('picinput'), csrf, scriptController.newPost);
app.post('/pageLog', passportConfig.isAuthenticated, userController.postPageLog);
app.post('/pageTimes', passportConfig.isAuthenticated, userController.postPageTime);

// app.get('/com', function(req, res) {
//     const feed = req.query.feed == "true" ? true : false; //Are we accessing the community rules from the feed?
//     res.render('com', {
//         title: 'Community Rules',
//         feed
//     });
// });

// app.get('/info', passportConfig.isAuthenticated, function(req, res) {
//     res.render('info', {
//         title: 'User Docs'
//     });
// });

// app.get('/tos', function(req, res) {
//     res.render('tos', {
//         title: 'TOS'
//     });
// });

app.get('/completed', passportConfig.isAuthenticated, userController.userTestResults);

// app.get('/notifications', passportConfig.isAuthenticated, notificationController.getNotifications);

app.get('/login', userController.getLogin); //Renders home page
// app.post('/login', userController.postLogin); //One-shot study doesn't require "logging in"
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.get('/signup', userController.getSignup); //Renders username/profile photo Page
app.post('/signup', userController.postSignup); //Creates new user or updates old user based on form fields

// app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
// app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
// app.post('/account/profile', passportConfig.isAuthenticated, useravatarupload.single('picinput'), csrf, userController.postUpdateProfile);
// app.get('/account/signup_info', passportConfig.isAuthenticated, function(req, res) {
//     res.render('account/signup_info', {
//         title: 'Add Information'
//     });
// });
// app.post('/account/signup_info_post', passportConfig.isAuthenticated, useravatarupload.single('picinput'), csrf, userController.postSignupInfo);
app.get('/account/interest', async function(req, res) {
    const data = await fs.readFileAsync(`${__dirname}/public/json/interestData.json`)
    const interestData = JSON.parse(data.toString());

    res.render('account/interest', {
        title: 'Choose your Interest',
        interestData
    });
});
app.post('/account/interest', passportConfig.isAuthenticated, userController.postInterestInfo)

// app.get('/me', passportConfig.isAuthenticated, userController.getMe);
// app.get('/user/:userId', passportConfig.isAuthenticated, actorsController.getActor);
// app.post('/user', passportConfig.isAuthenticated, actorsController.postBlockReportOrFollow);
app.get('/actors', actorsController.getActors)

app.get('/feed', passportConfig.isAuthenticated, scriptController.getScript);
app.post('/feed', passportConfig.isAuthenticated, scriptController.postUpdateFeedAction);
// app.post('/userPost_feed', passportConfig.isAuthenticated, scriptController.postUpdateUserPostFeedAction);
// app.get('/test', passportConfig.isAuthenticated, function(req, res) {
//     res.render('test', {
//         title: 'Test'
//     })
// });

/**
 * Error Handler.
 */

/**
 * Error Handler.
 */
// error handler
app.use(function(err, req, res, next) {
    // No routes handled the request and no system error, that means 404 issue.
    // Forward to next middleware to handle it.
    if (!err) return next();

    console.error(err);

    // set locals, only providing error stack and message in development
    // Express app.get('env') returns 'development' if NODE_ENV is not defined
    err.status = err.status || 500;
    err.stack = req.app.get('env') === 'development' ? err.stack : '';
    err.message = req.app.get('env') === 'development' ? err.message : " Oops! Something went wrong.";

    res.locals.message = err.message;
    res.locals.error = err;

    // render the error page
    res.status(err.status);
    res.render('error');
});

// catch 404. 404 should be considered as a default behavior, not a system error.
// Necessary to include because in express, 404 responses are not the result of an error, so the error-handler middleware will not capture them. https://expressjs.com/en/starter/faq.html 
app.use(function(req, res, next) {
    var err = new Error('Page Not Found.');
    err.status = 404;

    console.log(err);

    // set locals, only providing error stack in development
    err.stack = req.app.get('env') === 'development' ? err.stack : '';

    res.locals.message = err.message + " Oops! We can't seem to find the page you're looking for.";
    res.locals.error = err;

    // render the error page
    res.status(err.status);
    res.render('error');
});
/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
    console.log('  Press CTRL-C to stop\n');
});
module.exports = app;