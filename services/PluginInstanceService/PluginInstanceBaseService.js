//generated file
// not modified directly
var loopback = require("loopback"),
DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
config = require(utils.getRootPath() + "/services/modelConf/np-model-plugin_instance.js");

var PluginInstance = loopback.createModel(config);

DAOExtras(PluginInstance);

//create finders form finders property
PluginInstance.getByPluginNamespaceAndPageId = function getByPluginNamespaceAndPageId(pluginNamespace,pageId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"pluginNamespace":pluginNamespace,"pageId":pageId}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = PluginInstance;