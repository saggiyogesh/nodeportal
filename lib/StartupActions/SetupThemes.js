/**
 * Startup action to configure themes and setup public folder
 */

module.exports = function (app, done) {
    return function (next) {
        require("../static/ThemesWatcher").init(app);
        //set themes static folder
        require("../ThemeUtil").setThemesStaticFolder(app);
        next(null, done);
    };
};