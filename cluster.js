var recluster = require('recluster'),
    path = require('path');

var ClusterStore = require('strong-cluster-connect-store');
ClusterStore.setup();

var cluster = recluster("./app");
cluster.run();

process.on('SIGUSR2', function() {
    console.log('Got SIGUSR2, reloading cluster...');
    cluster.reload();
});

console.log("spawned cluster, kill -s SIGUSR2", process.pid, "to reload");
