//History.js configuration
(function (window, undefined) {

    function getUrlParts(url) {
        // see http://jsfiddle.net/saggiyogesh/ENmjB/
        var regex = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        var result = regex.exec(url);
        return result;
    }

    function getPluginIdFromUrl(url) {
        var result = getUrlParts(url), pathName = result[5];
        var pluginId = pathName.split("/")[1];
        return pluginId;

    }

    function getPreviousPluginId(History) {
        var savedStates = History.savedStates;
        var previousState = savedStates[savedStates.length - 2], previousUrl = previousState.url;
        return getPluginIdFromUrl(previousUrl);


//        for (var i = 0; i < savedStates.length; i++) {
//            var state = savedStates[i];
//            if()
//        }
    }

    // Check Location
    if (document.location.protocol === 'file:') {
        alert('The HTML5 History API (and thus History.js) do not work on files, please upload it to a server.');
    }

    // Establish Variables
    var History = window.History, // Note: We are using a capital H instead of a lower h
        State = History.getState();

    // Log Initial State
    History.log('initial:', State.data, State.title, State.url);

    // Bind to State Change
    History.Adapter.bind(window, 'statechange', function () { // Note: We are using statechange instead of popstate
        // Log the State
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        History.log('statechange:');
        History.log(State);

        var url = State.url;
        var prevPluginId , pluginId;
        pluginId = getPluginIdFromUrl(url);

        prevPluginId = getPreviousPluginId(History);

        if (!pluginId) {
//            pluginId = prevPluginId; //getPreviousPluginId(History);
            Rocket.AsyncCaller.callPlugin(prevPluginId);
            return ;
        }

        if (!prevPluginId || prevPluginId === pluginId) {
            Rocket.AsyncCaller.callPlugin(pluginId);
        }
        else {
            location.reload();
        }


    });
})(window);
