//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var ArticleLocationBaseService = require("./ArticleLocationBaseService");


//custom methods
ArticleLocationBaseService.removeArticleLocationsById = function removeArticleLocationsById(id, next) {
    async.waterfall([
        function (n) {
            ArticleLocationBaseService.getById(id, n);
        },
        function (articleLocations, n) {
            if(articleLocations){
                articleLocations.forEach(function(location){
                    ArticleLocationBaseService.remove(location.articleLocationId);
                });
            }
            n();
        }
    ], next);
    this.remove({id: id}, next);
};


module.exports = ArticleLocationBaseService;


