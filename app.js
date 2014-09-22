var DataSource = require('loopback-datasource-juggler').Schema;

util = require("util")
//app.use(loopback.rest());


//var dataSource = app.dataSource('db', {adapter: 'memory', debug: true});

var dataSource = new DataSource('memory');
var Color = dataSource.define('color', {
    'name': String
});

Color.prototype.test = function () {
    console.log("test> " + this.name);
};

Color.beforeDestroy = function (n, c) {
    console.log("beforeDestroy: " + util.inspect(this, true))
    n()
}

Color.afterDestroy = function (n, c) {
    console.log("afterDestroy: " + util.inspect(this, true))
    n()
};

Color.beforeUpdate = function (n, c) {
    console.log("beforeUpdate: " + util.inspect(this, true))
    n()
}

Color.afterUpdate = function (n, c) {
    console.log("afterUpdate: " + util.inspect(this, true))
    n()
};

Color.create({name: 'red'});
Color.create({name: 'green'});
Color.create({name: 'blue'});

Color.on("deleted", function(e, t){
    console.log(e);
})

Color.update({
        id: 1
    },
    {color: "new green"})

Color.all(function (e, c) {
    console.log(c);
});

Color.findOne({name: 'red'}, function (e, n) {
    n.test();
    n.delete();
});
setTimeout(function () {
    Color.remove({name: 'green'}, function (e, n) {
        if (e) throw  e;

        Color.all(function (e, c) {
            console.log(c);
        });
    })
}, 500)
//app.listen(3000);

console.log('a list of colors is available at http://localhost:300/colors');