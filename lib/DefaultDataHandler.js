/**
 *
 */
var mongoose = require('mongoose');
var EventEmitter = require('events').EventEmitter,
    path = require("path"), AppProperties = require("./AppProperties"),
    PasswordUtil = require("./PasswordUtil");
global.util = global.util || require("util");
global.utils = global.utils || require("../lib/utils");
//add Debug object to global
global.Debug = global.Debug || global.utils.Debug;
global._ = global._ || require("underscore");
var _l = Debug._l, _i = Debug._i;

exports.initDB = function (dbName) {
    var db = mongoose.createConnection('mongodb://localhost/' + dbName);
    db.on('open', function (e) {
        console.log("connected to db " + dbName);
        insertDefaultData(db);
        // db.close();
        // process.exit(1);
    });

};

handleErr = function (err) {
    if (err) {
        console.log(err);
        throw err;
    }
};
//
//updateCounter = function(co) {
//    co.counter = ++co.counter;
//    co.save(handleErr);
//}

exit = function () {
    process.exit(1);
};

var insertDefaultData = exports.insertDefaultData = function (db, appPermissions, next) {

    var modelPath = "../services/shell/model";
    require(modelPath + "/LayoutSchema");
    require(modelPath + "/PageSchema");
    require(modelPath + "/ThemeSchema");
    require(modelPath + "/CounterSchema");
    require(modelPath + "/UserSchema");
    require(modelPath + "/RoleSchema");
    require(modelPath + "/PluginInstanceSchema");
    //require(modelPath + "/PermissionEntriesSchema");
    // require(modelPath + "/PermissionActionSchema");

    var Layout = db.model('Layout');
    var Page = db.model('Page');
    var Theme = db.model('Theme');
    var Counter = db.model('Counter');
    var User = db.model('User');
    var Role = db.model('Role');
    var PluginInstance = db.model('PluginInstance');
    //var PermissionEntries = db.model('PermissionEntries');
    //var PermissionAction = db.model('PermissionAction');


    var processSave = helper(next);
    var Step = require('step');
    Step(function findCurrentCounter() {
        Counter.findOne({}, this);
    }, function save(err, co) {
        handleErr(err);
        _l("counter: " + _i(co));
        var c = 0;
        if (co) {
            //c = co.counter;
            Debug._l("Default data exits");
            if (next && _.isFunction(next)) {
                next();
                return;
            }
            else exit();
        }
        var savedObjects = {};
        var defaultTheme = new Theme({
            themeId:++c,
            name:"Default",
            path:'shell/theme/default'
        });
        processSave(defaultTheme);

        savedObjects.c = c;
        savedObjects.processSave = processSave;
        savedObjects.Theme = {};
        savedObjects.Theme.defaultTheme = defaultTheme;


        saveLayouts(Layout, savedObjects);
        saveRoles(Role, savedObjects);
        saveUsers(User, savedObjects);

        savePages(Page, appPermissions, savedObjects);

        savePluginInstance(PluginInstance, savedObjects);

        //savePermissionsEntries(PermissionEntries, savedObjects);
        //_l(_i(savedObjects));
        //savePermissionsActions(PermissionAction, savedObjects);

//        _l(_i(savedObjects));

        _l("Default data saved successfully.");
        //save counter in the end
        c = savedObjects.c;
        if (!co) {
            co = new Counter({
                counter:c
            });
        } else {
            co.counter = c;
        }

        processSave(co);
    });
};

function savePermissionsActions(PermissionAction, savedObjects) {
    var processSave = savedObjects.processSave;
    savedObjects.PermissionsAction = {};
    //set permission on pages
    Object.keys(savedObjects.Page).forEach(function (key) {
        var page = savedObjects.Page[key];
        var pageModelKey = "model.PageSchema",
            rolePerm = _.clone(savedObjects.permissionEntries[pageModelKey].rolePermissions);

        if (page.friendlyURL == "/test" || page.friendlyURL == "/settings") {
            rolePerm["Guest"] = 0;
        }
        var permAction = new PermissionAction({
            permissionActionId:++savedObjects.c,
            name:pageModelKey,
            resourceId:page.pageId,
            userId:savedObjects.User.admin.userId,
            rolePermissions:rolePerm
        });
        processSave(permAction);
        savedObjects.PermissionsAction[pageModelKey + "_" + permAction.resourceId] = permAction;
    });
}

function savePermissionsEntries(PermissionEntries, savedObjects) {
    var permissionDefs = require("./permissions/PermissionDefinitionProcessor").ProcessPermissions();
    var modelKeys = Object.keys(permissionDefs), processSave = savedObjects.processSave;
    _l("modelKeys: " + _i(modelKeys));
    savedObjects.permissionEntries = {};
    for (var i = 0; i < modelKeys.length; i++) {
        var key = modelKeys[i];
        var entry = permissionDefs[key];
//        _l("key: " + _i(key));
//        _l("entry: " + _i(entry));
        var permEntry = new PermissionEntries({
            permissionEntriesId:++savedObjects.c,
            name:key,
            permissions:entry.permissions,
            rolePermissions:entry.rolePermissions
        });
        processSave(permEntry);
        savedObjects.permissionEntries[key] = permEntry;
    }
}

function savePluginInstance(PluginInstance, savedObjects) {
    var processSave = savedObjects.processSave,
        admin = savedObjects.User.admin, userId = admin.userId, userName = admin.userName,
        rolePermissions = require("./PluginInstanceHandler").Permissions.rolePermissions;
    var login = new PluginInstance({
        pluginInstanceId:++savedObjects.c,
        pluginNamespace:"login",
        pageId:savedObjects.Page.homePage.pageId,
        title:{"en_US":"Login"},

        userId:userId,
        userName:userName,
        rolePermissions:rolePermissions
    });

    processSave(login);

    var displayArticle = new PluginInstance({
        pluginInstanceId:++savedObjects.c,
        pluginNamespace:"displayArticle_1",
        pageId:savedObjects.Page.homePage.pageId,
        title:{"en_US":"Display Article"},
        settings:{},

        userId:userId,
        userName:userName,
        rolePermissions:rolePermissions
    });
    processSave(displayArticle);

    savedObjects.PluginInstance = {
        login:login,
        displayArticle:displayArticle
    };

}
function savePages(Page, appPermissions, savedObjects) {
    var processSave = savedObjects.processSave,
        defaultTheme = savedObjects.Theme.defaultTheme,
        defaultLayout = savedObjects.Layout.defaultLayout,
        oneColLayout = savedObjects.Layout.oneColLayout,
        admin = savedObjects.User.admin, userId = admin.userId, userName = admin.userName,
        rolePermissions = appPermissions["model.PageSchema"].rolePermissions;
    var homePage = new Page({
        pageId:++savedObjects.c,
        layoutId:defaultLayout.layoutId,
        themeId:defaultTheme.themeId,
        friendlyURL:'/home',
        localizedName:{"en_US":"Home"},
        data:{
            col1HTMLTMPL:[ "login"],
            col2HTMLTMPL:[ "displayArticle_1" ]
        },
        isIndex:true,
        userId:userId,
        userName:userName,
        rolePermissions:rolePermissions

    });
    processSave(homePage);

    var rolePermissionsSettingsPage = _.clone(rolePermissions);
    delete rolePermissionsSettingsPage["Guest"];


    var settingsPage = new Page({
        pageId:++savedObjects.c,
        layoutId:oneColLayout.layoutId,
        themeId:defaultTheme.themeId,
        friendlyURL:'/settings',
        localizedName:{"en_US":"Settings"},
        data:{
            col1HTMLTMPL:[ ]
        },
        isHidden:true,
        userId:userId,
        userName:userName,
        rolePermissions:rolePermissionsSettingsPage
    });
    processSave(settingsPage);

    var testPage = new Page({
        pageId:++savedObjects.c,
        layoutId:oneColLayout.layoutId,
        themeId:defaultTheme.themeId,
        friendlyURL:'/test',
        localizedName:{"en_US":"Test Page", "nl_NL":"Test Pagina"},
        data:{
            col1HTMLTMPL:[ ]
        },
        isHidden:true,
        userId:userId,
        userName:userName,
        rolePermissions:rolePermissions

    });
    processSave(testPage);

    var testPage2 = new Page({
        pageId:++savedObjects.c,
        layoutId:defaultLayout.layoutId,
        themeId:defaultTheme.themeId,
        friendlyURL:'/test2',
        localizedName:{"en_US":"Test Page 2", "nl_NL":"Test Pagina 2"},
        data:{
            col1HTMLTMPL:[ ],
            col2HTMLTMPL:[ ]
        },
        isHidden:true,
        userId:userId,
        userName:userName,
        rolePermissions:rolePermissions

    });
    //processSave(testPage2);

    savedObjects.Page = {};
    savedObjects.Page.homePage = homePage;
    savedObjects.Page.testPage = testPage;
    //savedObjects.Page.testPage2 = testPage2;
    savedObjects.Page.settingsPage = settingsPage;
}

function saveRoles(Role, savedObjects) {
    var processSave = savedObjects.processSave;
    var guestRole = new Role({
        roleId:++savedObjects.c,
        name:"Guest",
        description:"Unauthenticated users are having this role"
    });
    processSave(guestRole);

    var adminRole = new Role({
        roleId:++savedObjects.c,
        name:"Administrator",
        description:"Administrator users are having this role"
    });
    processSave(adminRole);

    var userRole = new Role({
        roleId:++savedObjects.c,
        name:"User",
        description:"Authenticated users should have this role"
    });
    processSave(userRole);
    savedObjects.Role = {};
    savedObjects.Role.guestRole = guestRole;
    savedObjects.Role.adminRole = adminRole;
    savedObjects.Role.userRole = userRole;
//    return {guestRole:guestRole, adminRole:adminRole, userRole:userRole, c:c};
}

function saveLayouts(Layout, savedObjects) {
    var processSave = savedObjects.processSave;
    var defaultL = new Layout({
        layoutId:++savedObjects.c,
        name:"2-col-70-30",
        path:'shell/layout/index',
        placeHolderNames:[ "col1HTMLTMPL", "col2HTMLTMPL" ]
    });
    processSave(defaultL);

    var oneCol = new Layout({
        layoutId:++savedObjects.c,
        name:"1-col",
        path:'shell/layout/1-column',
        placeHolderNames:[ "col1HTMLTMPL"]
    });
    processSave(oneCol);

//    return {c:c, defaultLayout:defaultL, oneColLayout:oneCol};
    savedObjects.Layout = {};
    savedObjects.Layout.defaultLayout = defaultL;
    savedObjects.Layout.oneColLayout = oneCol;
}

function saveUsers(User, savedObjects) {
    var processSave = savedObjects.processSave
        , guestRole = savedObjects.Role.guestRole,
        adminRole = savedObjects.Role.adminRole,
        userRole = savedObjects.Role.userRole
    var guest = new User({
        userId:++savedObjects.c,
        userName:"guest",
        firstName:"guest",
        middleName:"",
        lastName:"guest",
        passwordEnc:"",
        emailId:"guest@nodeportal.com",
        roles:[guestRole.name],
        phoneNo:"",
        active:true,
        "default":true
    });

    processSave(guest);

    var admin = new User({
        userId:++savedObjects.c,
        userName:"admin",
        firstName:"Admin",
        middleName:"",
        lastName:"",
        passwordEnc:PasswordUtil.encryptSync("admin"),
        emailId:"admin@nodeportal.com",
        roles:[adminRole.name],
        phoneNo:"",
        active:true,
        dob:new Date()
    });

    processSave(admin);

    savedObjects.User = {};
    savedObjects.User.guest = guest;
    savedObjects.User.admin = admin;
}

function helper(next) {
    var completeEvent = new EventEmitter(), arr = [], push = function (c) {
        arr.push(c);
    }, onSave = function (err) {
        if (err) {
            console.log(err);
            throw err;
        }

        this.on('complete', function () {
            arr.pop();
            if (arr.length == 0)
                completeEvent.emit('complete', 'exit');
        });

    };
    completeEvent.on('complete', function (done) {
//        console.log(done);
        if (next && _.isFunction(next)) {
            next();
        }
        else
            exit();
    });

    return function processSave(model) {
        push(true);
        model.save(onSave);
    };

}
