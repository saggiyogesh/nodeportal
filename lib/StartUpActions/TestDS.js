assert = require("assert")
var getModelEvent = require("../ModelEvents").getModelEvent;
module.exports = function (app, done) {
    return function (next) {
        var ds = app.dataSource;
        Debug._l(ds);
        var CarService = require("../../services/CarService")
        CarService.find({}, function (e, m) {
            Debug._li("", m, true)
            assert(m, "fine")
        });

        CarService.getPagesByThemeId(1, function (e, t) {
            Debug._li("", t, true)
            assert(t, "fine")
        })

        CarService.create({
            "friendlyURL" : "/home",
            "isHidden" : false,
            data: "tt",
            createDate : Date.now(),
            updateDate : Date.now(),
            "isIndex" : true,
            "layoutId" : 3,
            "order" : 0,
            "pageId" : 10,
            "parentPageId" : 0,
            localizedName: "home",
            "rolePermissions" : {
                "5" : [
                    16
                ],
                "6" : [
                    1,
                    2,
                    4,
                    8,
                    16,
                    32
                ],
                "7" : [
                    16
                ]
            },
            "themeId" : 1,
            "userId" : 8,
            "userName" : "admin"
        }, function(err, t) {
            if(err ) throw  err;
            Debug._l(t)
        })

        var req = {
            session: {
                roles: [999]
            },
            app: app
        }

        var CarServiceAuth = CarService.Auth;
        CarServiceAuth.getPagesByThemeId(1, req.session.roles, function (e, t) {
            Debug._li("", t, true)
            assert(t, "fine")
        })

        CarServiceAuth.find({}, req.session.roles, function (e, t) {
            Debug._li("", t, true)
            assert(t, "fine")
        })

        CarService.count({themeId: 1}, function (e, t) {
            Debug._l(t)
            assert(t, "fine")
        })

//        CarServiceAuth.count({themeId: 1}, req.session.roles, function (e, t) {
//            Debug._l(t)
//        })


        next()
    };
};