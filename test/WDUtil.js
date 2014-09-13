var util = require("util"),
    wd = require("wd"), Webdriver = wd.Webdriver,
    asserters = wd.asserters,
    async = require('async'),
    ElementNotFoundError = function ElementNotFoundError(selector) {
        this.name = "ElementNotFoundError";
        this.message = "No element found by selector: " + selector;
    };


util.inherits(ElementNotFoundError, Error);

var WDXtraMethods = {};

/**
 * Handles click of element
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.fireClick = function (selector, cb, wait) {
    var that = this;
    that.fire(selector, "click", cb, wait);
};

/**
 * Generic method used for event handling
 * @param selector {String} css selector
 * @param event {String} event name
 * @param cb {Function} callback. parameters are err
 * @param [wait]  {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.fire = function (selector, event, cb, wait) {
    var that = this;
    async.waterfall([
            function (n) {
                that.querySelector(selector, n, wait);
            },
            function (el, n) {
                if (el) {
                    el[event](n);
                }
                else {
                    n(new ElementNotFoundError(selector));
                }
            }
        ],
        function (err, result) {
            cb(err);
        });

};

/**
 * Chooses & attaches file to input provided by selector
 * @param selector  {String} css selector
 * @param filePath  {String} full absolute file path, to be uploaded
 * @param cb  {Function} callback. parameters are err
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.chooseFile = function (selector, filePath, cb, wait) {
    var that = this;
    async.waterfall([
            function (n) {
                that.querySelector(selector, n, wait)
            },
            function (el, n) {
                if (el) {
                    el.sendKeys(filePath, n)
                }
                else {
                    n(new ElementNotFoundError(selector));
                }
            }
        ],
        function (err, result) {
            cb(err);
        });
};

/**
 * Waits for element to be displayed
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err and element
 */
WDXtraMethods.querySelectorWaitFor = function (selector, cb) {
    this.waitForElementByCssSelector(selector, asserters.isDisplayed, cb);
};

/**
 * Waits for elements to be displayed
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err and elements
 */
WDXtraMethods.querySelectorAllWaitFor = function (selector, cb) {
    this.waitForElementsByCssSelector(selector, asserters.isDisplayed, cb);
};

/**
 * selector for element with css selector
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err, element
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.querySelector = function (selector, cb, wait) {
    wait ? this.querySelectorWaitFor(selector, cb) : this.elementByCssSelector(selector, cb);
};

/**
 * selector for elements with css selector
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err, elements
 * @param [wait] {Boolean} if true then waits for the elements to shown
 */
WDXtraMethods.querySelectorAll = function (selector, cb, wait) {
    wait ? this.querySelectorAllWaitFor(selector, cb) : this.elementsByCssSelector(selector, cb);
};

/**
 * Method used to fill the value in input box or text area
 * @param selector {String} css selector
 * @param value {String} value to be filled
 * @param cb {Function} callback. parameters are err
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.fill = function (selector, value, cb, wait) {
    var that = this;
    async.waterfall([
            function (n) {
                that.querySelector(selector, n, wait)
            },
            function (el, n) {
                if (el) {
                    el.type(value, n)
                }
                else {
                    n(new ElementNotFoundError(selector));
                }
            }
        ],
        function (err, result) {
            cb(err);
        });
};

/**
 * Opens url on same page
 * @param url {String} url to be opened
 * @param cb {Function} callback. parameters are err, element
 */
WDXtraMethods.open = function (url, cb) {
    this.get(url, cb);
};

/**
 * Gets text of element by selector
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err, text
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.getElementText = function (selector, cb, wait) {
    var that = this, text;

    async.waterfall([
            function (n) {
                that.querySelector(selector, n, true);
            } ,
            function (el, n) {
                if (!el) {
                    n(new ElementNotFoundError(selector))
                }
                else {
                    n(null, el);
                }
            }, function (el, n) {
                el.text(n)
            }, function (t, n) {
                text = t;
                n();
            }
        ],
        function (err, r) {
            cb(err, text);

        });
};

/**
 * Method used to run execute js on browser.
 * @param execFn {Function} Body of this fn is passed to browser to execute it.
                            Don't pass anything in this function
 * @param cb {Function} callback. parameters are err, text (returned by js code executed on browser)
 */
WDXtraMethods.runScript = function (execFn, cb) {
    var that = this, fnBody = execFn.toString(), beginSelector = "{", lastSelector = "}",
        beginSelectorLength = beginSelector.length,
        beginIndex = fnBody.indexOf(beginSelector) + beginSelectorLength,
        lastIndex = fnBody.lastIndexOf(lastSelector);

    fnBody = fnBody.substring(beginIndex, lastIndex);

//    console.log(fnBody);
    that.execute(fnBody, cb);
};

/**
 * Checks if element with selector is visible on browser
 * @param selector {String} css selector
 * @param cb {Function} callback. parameters are err, true|false
 * @param [wait] {Boolean} if true then waits for the element to shown
 */
WDXtraMethods.isElementVisible = function (selector, cb, wait) {
    var that = this;
    async.waterfall([
            function (n) {
                that.querySelector(selector, n, wait)
            },
            function (el, n) {
                if (el) {
                    el.isDisplayed(n)
                }
                else {
                    n(new ElementNotFoundError(selector));
                }
            }
        ],
        function (err, result) {
            cb(err, result);
        });

};


Object.keys(WDXtraMethods).forEach(function (methodName) {
    wd.addAsyncMethod(methodName, WDXtraMethods[methodName]);
});

exports.Browser = function (options, cb) {
    var wdOptions = options.wd;
    var browser = wd.remote();
    async.series([
            function (n) {
                browser.init({browserName: 'firefox'}, n)
            } ,
            function (n) {
                browser.get(options.url, n);
            }
        ],
        function (err, r) {
            cb(err, browser);

        });

    if (options.enableExtraLogging) {
        browser.on('status', function (info) {
            console.log(info);
        });
        browser.on('command', function (eventType, command, response) {
            console.log(' > ' + eventType, command, (response || ''));
        });
        browser.on('http', function (meth, path, data) {
            console.log(' > ' + meth, path, (data || ''));
        });
    }
};
