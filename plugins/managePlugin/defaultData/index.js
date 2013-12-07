var login = {
    pluginNamespace: "login",
    pageId: 0,
    title: {"en_US": "Login"},
    userId: 0,
    userName: "",
    rolePermissions: {}
};

var displayArticle = {
    pluginNamespace: "displayArticle_1",
    pageId: 0,
    title: {"en_US": "Display Article"},
    settings: {},
    userId: 0,
    userName: "",
    rolePermissions: {}
};

module.exports = {PluginInstance: {
    login: login,
    displayArticle: displayArticle
}, deps: ['User', 'Page']};