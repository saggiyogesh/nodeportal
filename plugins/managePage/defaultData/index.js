var homePage = {
    pageId: "c",
    layoutId: "",
    themeId: "",
    friendlyURL: '/home',
    localizedName: {"en_US": "Home"},
    data: {
        col1HTMLTMPL: [ "login"],
        col2HTMLTMPL: [ "displayArticle_1" ]
    },
    isIndex: true,
    userId: "",
    userName: "",
    rolePermissions: {}
};

var testPage = {
    pageId: "c",
    layoutId: 0,
    themeId: 0,
    friendlyURL: '/test',
    localizedName: {"en_US": "Test Page", "nl_NL": "Test Pagina"},
    data: {
        col1HTMLTMPL: [ ]
    },
    order:1,
    isHidden: true,
    userId: 0,
    userName: "",
    rolePermissions: {}
};
module.exports = {Page: {
    home: homePage,
    test: testPage
}, deps: ['Theme', 'Layout', 'User']};

