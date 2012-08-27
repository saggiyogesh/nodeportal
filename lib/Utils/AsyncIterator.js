/**
 * Utility to perform loop iterate in a async way
 * Usage:
 *
 */

var AsyncIterator = exports.AsyncIterator = function (vals, next) {
    this.vals = vals;
    this.next = next;
    this.i = -1;
};

/*AsyncIterator.prototype.getCounter = function () {
    return this._i;
};*/

AsyncIterator.prototype.setAsyncProcess = function (asyncProcess) {
    this._asyncProcess = asyncProcess;
    this.iterate();
};

/*AsyncIterator.prototype.incrementCounter = function () {
    this._i = this._i + 1;
};*/

AsyncIterator.prototype.iterate = function () {
    var that = this, vals = that.vals, asyncProcess = that._asyncProcess, next = that.next;
    that.i = that.i + 1;
    if (that.i < vals.length) {
//        var asyncP = asyncProcess();
        asyncProcess.call(that);
    }
    else {
        next(undefined, true);
    }
};


