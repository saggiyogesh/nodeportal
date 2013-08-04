/**
 *
 */

define( function(){

    function Events() {
        this._listeners = {};
    }

    Events.prototype = {
        constructor:Events,
        bind:function (type, listener) {
            if (typeof this._listeners[type] == "undefined") {
                this._listeners[type] = [];
            }
            this._listeners[type].push(listener);
        },
        trigger:function (event) {
            if (typeof event == "string") {
                event = {
                    type:event
                };
            }

            if (!event.type) {
                throw new Error("Event object missing 'type' property.");
            }
            if (!event.target) {
                event.target = this;
            }
            if (this._listeners[event.type] instanceof Array) {
                var listeners = this._listeners[event.type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, event);
                }
            }
        },
        unbind:function (type, listener) {
            if (this._listeners[type] instanceof Array) {
                var listeners = this._listeners[type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };

    var baseEvent = new Events();
    Rocket.trigger = function (event) {
        baseEvent.trigger.call(baseEvent, event);
    };
    Rocket.bind = function (event, listener) {
        baseEvent.bind.call(baseEvent, event, listener);
    };
    Rocket.unbind = function (event, listener) {
        baseEvent.unbind.call(baseEvent, event, listener);
    };
});
