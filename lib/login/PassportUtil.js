var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    LinkedInStrategy = require('passport-linkedin-oauth2').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    getProp = require("../AppProperties").get,
    PasswordUtil = require("../PasswordUtil"),
    Helpers = require("../Helpers"),
    LoginUtil = require("./LoginUtil"),
    USER_SCHEMA = "User";

exports.passport = passport;

var Strategies = {
    local: LocalStrategy,
    google: GoogleStrategy,
    linkedin: LinkedInStrategy,
    twitter: TwitterStrategy,
    facebook: FacebookStrategy
};

var Scopes = {
    google: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ],
    facebook: ['email', 'user_about_me']
};


function loginSuccess(accessToken, refreshToken, profile, done) {
    done(null, profile)
}

function initLocalStrategy(app) {
    passport.use(new LocalStrategy({
            usernameField: 'login[email]',
            passwordField: 'login[password]'
        },
        function (email, password, done) {
            var UserService = app.getService(USER_SCHEMA);
            UserService.getByEmailId(email, function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false);
                }
                PasswordUtil.check(password, user.passwordEnc, function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    if (result && result === true) {
                        return done(null, user);
                    }
                    else {
                        return done(null, false);
                    }
                });
            });
        }
    ));
}

exports.init = function (app) {
    initLocalStrategy(app);

    var accounts = getProp("ENABLED_LOGIN_ACCOUNTS");
    if (accounts) {
        accounts = accounts.split(",");
        var loginConfig = getProp("LOGIN_ACCOUNTS_CONFIG");
        accounts.forEach(function (acc) {
            var config = loginConfig[acc];
            var strategy = Strategies[acc];
            if (config && strategy) {
                Debug._li(">> ", config, true)
                passport.use(new strategy(config, loginSuccess));
            }
        });

    }

};

exports.startOAuthAction = function (account, req, res) {
    passport.authenticate(account, {
        scope: Scopes[account],
        state: '_'
    })(req, res);
};

exports.oAuthCallbackAction = function (account, req, res) {

    passport.authenticate(account,
        function (err, user) {
            Debug._l("at 2 >> " + " : " + req.params.plugin)
            Debug._li("..", user, true)
            if (err) {
                Helpers.setErrorMessage(req, err);
            }
//            if (err || !user) {
//                res.redirect("/app/login");
//            }
//            user && LoginUtil.regenerateSession(user, req);

            //TODO review user info got from oauth & save it to db and logged in as user in app

            req.session.oAuthUser = user;

            res.redirect("/app/login");
        }
    )(req, res);
};