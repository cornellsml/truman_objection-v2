const bluebird = require('bluebird');
const User = require('../models/User');
const Notification = require('../models/Notification.js');
const Script = require('../models/Script.js');

// From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

// create random id for guest accounts
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/login', {
        title: 'Login'
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
// exports.postLogin = (req, res, next) => {
//     req.assert('email', 'Email is not valid.').isEmail();
//     req.assert('password', 'Password cannot be blank.').notEmpty();
//     req.sanitize('email').normalizeEmail({ remove_dots: false });

//     const errors = req.validationErrors();

//     if (errors) {
//         req.flash('errors', errors);
//         console.log(errors);
//         return res.redirect('/login');
//     }

//     passport.authenticate('local', (err, user, info) => {
//         const two_days = 172800000; //Milliseconds in 2 days
//         const time_diff = Date.now() - user.createdAt; //Time difference between now and account creation.
//         if (err) { return next(err); }
//         if (!user) {
//             req.flash('errors', info);
//             return res.redirect('/login');
//         }
//         if (!(user.active) || ((time_diff >= two_days) && !user.isAdmin)) {
//             // var post_url = user.endSurveyLink;
//             req.flash('final');
//             return res.redirect('/login');
//         }
//         req.logIn(user, (err) => {
//             if (err) { return next(err); }

//             var temp = req.session.passport; // {user: 1}
//             var returnTo = req.session.returnTo;
//             req.session.regenerate(function(err) {
//                 //req.session.passport is now undefined
//                 req.session.passport = temp;
//                 req.session.save(function(err) {
//                     const time_now = Date.now();
//                     const userAgent = req.headers['user-agent'];
//                     const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//                     user.logUser(time_now, userAgent, user_ip);
//                     if (user.consent) {
//                         return res.redirect(returnTo || '/');
//                     } else {
//                         return res.redirect(returnTo || '/account/signup_info');
//                     }
//                 });
//             });
//         });
//     })(req, res, next);
// };

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
    req.logout();
    req.session.regenerate(function() {
        res.redirect('/thankyou');
    })
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/signup', {
        title: 'Create Account'
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
    // (1) If given r_id from Qualtrics: If user instance exists, go to profile page. If doens't exist, create a user instance. 
    // (2) If not given r_id from Qualtrics: Generate a random username, not used yet, and save user instance.
    if (req.query.r_id == 'null' || !req.query.r_id || req.query.r_id == 'undefined') {
        req.query.r_id = makeid(10);
    }

    let experimentalCondition;
    // (1) If given obj1, and obj2 from Qualtrics: Use this as experimental condition
    // (2) If not given from Qualtrics: Select a random number (0-10: since there are 10 conditions)
    if (!req.query.obj1 || req.query.obj1 == 'null' || req.query.obj1 == 'undefined') {
        const conditionMessages = [
            '1_1', '1_2', '2_1', '2_2', '0_1', '0_2', '1_1&2_2', '1_2&2_1', '2_1&1_1', '2_2&1_2'
        ];
        experimentalCondition = conditionMessages[(Math.floor(Math.random() * 9))];
    } else {
        // ---- Conditions: 14 possible conditions: 12 experimentals & 2 controls ------//
        // Retributive Message 1: 1_1
        // Retributive Message 2: 1_2
        // Retributive Message 1 + Restorative Message 1: 1_1 & 2_1 (unused)
        // Retributive Message 1 + Restorative Message 2: 1_1 & 2_2
        // Retributive Message 2 + Restorative Message 1: 1_2 & 2_1 
        // Retributive Message 2 + Restorative Message 2: 1_2 & 2_2 (unused)

        // Restorative Message 1: 2_1
        // Restorative Message 2: 2_2
        // Restorative Message 1 + Retributive Message 1: 2_1 & 1_1
        // Restorative Message 1 + Retributive Message 2: 2_1 & 1_2 (unused)
        // Restorative Message 2 + Retributive Message 1: 2_2 & 1_1 (unused)
        // Restorative Message 2 + Retributive Message 2: 2_2 & 1_2

        // Control Message 1: 0_1
        // Control Message 2: 0_2
        experimentalCondition = req.query.obj1 + (!req.query.obj2 || req.query.obj2 == 'null' || req.query.obj2 == 'undefined' ? '' : "&" + req.query.obj2);
    }

    // Experimental Condition is assigned via Qualtrics, passed
    User.findOne({ mturkID: req.query.r_id }, (err, existingUser) => {
        if (err) { return next(err); }
        let user;
        if (existingUser) {
            existingUser.username = req.body.username;
            existingUser.profile.picture = req.body.photo;
            existingUser.profile.name = req.body.username;
            user = existingUser;
        } else {
            user = new User({
                mturkID: req.query.r_id,
                username: req.body.username,
                profile: {
                    name: req.body.username,
                    color: '#a6a488',
                    picture: req.body.photo
                },
                group: experimentalCondition,
                active: true,
                lastNotifyVisit: (Date.now()),
                createdAt: (Date.now())
            });
        }

        user.save((err) => {
            if (err) { return next(err); }
            req.logout();
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                var temp = req.session.passport; // {user: 1}
                req.session.regenerate(function(err) {
                    //req.session.passport is now undefined
                    req.session.passport = temp;
                    req.session.save(function(err) {
                        const time_now = Date.now();
                        const userAgent = req.headers['user-agent'];
                        const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        user.logUser(time_now, userAgent, user_ip);
                        res.set('Content-Type', 'application/json; charset=UTF-8');
                        res.send({ result: "success" });
                    });
                });
            });
        });
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
// exports.postSignupInfo = (req, res, next) => {
//     User.findById(req.user.id, (err, user) => {
//         if (err) { return next(err); }
//         user.profile.name = req.body.name.trim() || '';
//         user.profile.location = req.body.location.trim() || '';
//         user.profile.bio = req.body.bio.trim() || '';

//         if (req.file) {
//             console.log("Changing Picture now to: " + req.file.filename);
//             user.profile.picture = req.file.filename;
//         }

//         user.save((err) => {
//             if (err) {
//                 if (err.code === 11000) {
//                     return res.redirect('/account/signup_info');
//                 }
//                 return next(err);
//             }
//             req.flash('success', { msg: 'Profile information has been updated.' });
//             return res.redirect('/com');
//         });
//     });
// };

/**
 * POST /account/interest
 * Update interest information.
 */
exports.postInterestInfo = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }

        user.interest = req.body.interest;
        user.consent = true;

        user.save((err) => {
            if (err) {
                return next(err);
            }
            res.set('Content-Type', 'application/json; charset=UTF-8');
            res.send({ result: "success" });
        });
    });
};


/**
 * GET /account
 * Profile page.
 */
// exports.getAccount = (req, res) => {
//     res.render('account/profile', {
//         title: 'Account Management'
//     });
// };

/**
 * GET /me
 * Profile page.
 */
// exports.getMe = (req, res) => {
//     User.findById(req.user.id)
//         .populate({
//             path: 'posts.comments.actor',
//             model: 'Actor'
//         })
//         .exec(function(err, user) {
//             if (err) { return next(err); }
//             var allPosts = user.getPosts();
//             res.render('me', { posts: allPosts, title: user.profile.name || user.email || user.id });
//         });
// };

/**
 * POST /account/profile
 * Update profile information.
 */
// exports.postUpdateProfile = (req, res, next) => {
//     req.assert('email', 'Please enter a valid email address.').isEmail();
//     req.sanitize('email').normalizeEmail({ remove_dots: false });

//     const errors = req.validationErrors();

//     if (errors) {
//         req.flash('errors', errors);
//         return res.redirect('/account');
//     }

//     User.findById(req.user.id, (err, user) => {
//         if (err) { return next(err); }
//         user.email = req.body.email || '';
//         user.profile.name = req.body.name || '';
//         user.profile.location = req.body.location || '';
//         user.profile.bio = req.body.bio || '';

//         if (req.file) {
//             console.log("Changing Picture now to: " + req.file.filename);
//             user.profile.picture = req.file.filename;
//         }

//         user.save((err) => {
//             if (err) {
//                 if (err.code === 11000) {
//                     req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
//                     return res.redirect('/account');
//                 }
//                 return next(err);
//             }
//             req.flash('success', { msg: 'Profile information has been updated.' });
//             res.redirect('/account');
//         });
//     });
// };

/**
 * POST /account/password
 * Update current password.
 */
// exports.postUpdatePassword = (req, res, next) => {
//     req.assert('password', 'Password must be at least 4 characters long').len(4);
//     req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

//     const errors = req.validationErrors();

//     if (errors) {
//         req.flash('errors', errors);
//         return res.redirect('/account');
//     }

//     User.findById(req.user.id, (err, user) => {
//         if (err) { return next(err); }
//         user.password = req.body.password;
//         user.save((err) => {
//             if (err) { return next(err); }
//             req.flash('success', { msg: 'Password has been changed.' });
//             res.redirect('/account');
//         });
//     });
// };

/**
 * POST /pageLog
 * Post a pageLog
 */
exports.postPageLog = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.logPage(Date.now(), req.body.path);
        user.save((err) => {
            if (err) {
                return next(err);
            }
            res.set('Content-Type', 'application/json; charset=UTF-8');
            res.send({ result: "success" });
        });
    });
};

/**
 * POST /pageTimes
 * Post a pageTime
 */
exports.postPageTime = (req, res, next) => {
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        const log = {
            time: req.body.time,
            page: req.body.pathname,
        };
        user.pageTimes.push(log);
        user.save((err) => {
            if (err) {
                return next(err);
            }
            res.set('Content-Type', 'application/json; charset=UTF-8');
            res.send({ result: "success" });
        });
    });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

/**
 * Turn off all old accounts. Groundhog admin accounts
 */
exports.stillActive = () => {
    User.find()
        .where('active').equals(true)
        .exec(
            function(err, users) {
                // handle error
                if (err) { console.log(err); } else {
                    for (const user of users) {
                        var time_diff = Date.now() - user.createdAt;
                        var two_days = 172800000;
                        if (time_diff >= two_days) {
                            if (!user.isAdmin) {
                                user.active = false;
                                user.logPostStats();
                                user.save((err) => {
                                    if (err) { return next(err); }
                                    console.log("Success in turning off.");
                                });
                            }
                        }
                    }
                }
            });
};

/**
 * Basic information on Users currrently in the study
 */
exports.userTestResults = (req, res) => {
    //only admin can do this   
    if (!req.user.isAdmin) {
        res.redirect('/');
    } else {
        User.find()
            .where('isAdmin').equals(false)
            .exec(
                function(err, users) {
                    if (err) { console.log(err); } else {
                        // E-mail all active users
                        for (const user of users) {
                            var time_diff = Date.now() - user.createdAt;
                            var two_days = 172800000;
                            if (time_diff >= two_days) {
                                if (!user.isAdmin) {
                                    user.active = false;
                                    user.logPostStats();
                                    user.save((err) => {
                                        if (err) { return next(err); }
                                        console.log("Success in turning off.");
                                    });
                                }
                            }
                        }
                        res.render('completed', { users: users });
                    }
                });
    }
};