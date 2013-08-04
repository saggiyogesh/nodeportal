var assetManager = require('connect-assetmanager'), assetHandler = require('connect-assetmanager-handlers');
exports.AssetManager = function () {
    var clientJSLoadOrder = ['jquery-ui.min.js', 'bootstrap.min.js', 'underscore.min.js', 'main.js',
            'events.js', 'util.js', 'plugin.js', 'json2.js', 'jquery.cookie.js', 'asyncCaller.js',
            'fileuploader.js', 'jquery.contextMenu-custom.js', 'jquery.dynatree.min.js', 'pluginURL.js',
            'jquery.dataTables.js', 'datatables-bootstrap.js', 'tables.js', 'jquery.typing.js',
            'jquery.iframe-transport.js', 'jquery.fileupload.js', 'jquery.fileupload-ui.js',
            'uploader.js']

        , clientCSSLoadOrder = ['bootstrap.min.css', 'bootstrap-responsive.min.css', 'jquery-ui.min.css', 'style.css',
            'fileuploader.css', 'jquery.contextMenu.css', 'ui.dynatree.css', 'datatables-bootstrap.css'
            , 'jquery.fileupload-ui.css']

        , assetManagerGroups = {
            /*'js':{
             'route':/\/static\/js\/main.js/, 'path':'./public/js/', 'dataType':'javascript',
             'files':clientJSLoadOrder, debug:true

             },*/
            /*'css':{
             'route':/\/static\/css\/main.css/, 'path':'./public/css/', 'dataType':'css',
             'files':clientCSSLoadOrder, debug:true
             }*/
        }

        , assetManagerGroupsProd = {
            /*'js':{
             'route':/\/static\/js\/main.js/, 'path':'./public/js/', 'dataType':'javascript',
             'files':clientJSLoadOrder, 'postManipulate':{
             '^':[
             assetHandler.uglifyJsOptimize
             ]
             }

             },*/
            'css': {
                'route': /\/static\/css\/main.css/, 'path': './public/css/', 'dataType': 'css',
                'files': clientCSSLoadOrder, 'preManipulate': {
                    // Matches all (regex start line)
                    '^': [
                        assetHandler.yuiCssOptimize
                        , assetHandler.fixVendorPrefixes
                        , assetHandler.fixGradients
                        , assetHandler.replaceImageRefToBase64(root)
                    ]
                }

            }
        };

    return {assetManagerGroups: assetManagerGroups, assetManagerGroupsProd: assetManagerGroupsProd}
};