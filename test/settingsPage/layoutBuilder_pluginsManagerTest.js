var wd = require('wd'),
    chai = require('chai'),
    expect = chai.expect,
    _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    uuid = require('uuid-js');

var VARS = {}, CssSelector = 'css selector';

// This assumes that selenium is running at http://127.0.0.1:4444/wd/hub/
var noop = function() {},
    b = wd.remote();

describe('Selenium Test Case', function() {

    this.timeout(2000000);

    it('should execute test case without errors', function(done) {

        b.chain(function(err) {
            done(err);
        })
            .init({
                browserName: 'firefox'
            })
            .get("http://demo.nodeportal.com/home")
            .elementByLinkText("Login", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("login_email", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "testadmin@nodeportal.com", noop);
                });
            })
            .elementById("login_password", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "admin", noop);
                });
            })
            .elementById("login_submit_login", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("testUserAdmin", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("site_settings_page", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("Layout Builder", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("layoutBuilder_create", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByCssSelector("input.input-block-level", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "new layout test", noop);
                });
            })
            .elementByLinkText("OK", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByCssSelector("#layoutBuilder_successFlash > button.close", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .refresh(noop)
            .elementById("layoutBuilder_open", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("new layout test", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, ".column.span8 !{col1HTMLTMPL}\n.column.span4 !{col2HTMLTMPL}", noop);
                });
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, ".column.span8. !{col1HTMLTMPL}\n.column.span4 !{col2HTMLTMPL}\n.column.span4 !{col2HTMLTMPL}", noop);
                });
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, ".column.span8 !{col1HTMLTMPL}\n.column.span4 !{col2HTMLTMPL}\n.column.span4 !{col3HTMLTMPL}", noop);
                });
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, ".column.span4 !{col1HTMLTMPL}\n.column.span4 !{col2HTMLTMPL}\n.column.span4 !{col3HTMLTMPL}", noop);
                });
            })
            .elementById("layoutBuilder_template", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, ".column.span4.pc1 !{col1HTMLTMPL}\n.column.span4.pc2 !{col2HTMLTMPL}\n.column.span4.pc3 !{col3HTMLTMPL}", noop);
                });
            })
            .elementById("layoutBuilder_placeholders", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "col3HTMLTMPL,col1HTMLTMPL,col2HTMLTMPL", noop);
                });
            })
            .elementByCssSelector("div.controls", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("layoutBuilder_placeholders", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("layoutBuilder_submit_save", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByCssSelector("button.close", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("Site Pages", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("next", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("managePage_name", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "New page for layout testing", noop);
                });
            })
            .elementById("managePage_friendlyURL", function(err, el) {
                b.next('clear', el, function(err) {
                    b.next('type', el, "newpageforlayouttesting", noop);
                });
            })
            .elementByXPath("//form[@id='managePage_fm']/fieldset/div[4]/div/select//option[3]", function(err, el) {
                b.next('isSelected', el, function(err, isSelected) {
                    if (!isSelected) {
                        b.next('clickElement', el, noop);
                    }
                });
            })
            .elementById("managePage_submit_update", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByCssSelector("button.close", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("NodePortal", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("New page for layout testing", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByXPath("//div[@class='row-fluid']/div[1]", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByXPath("//html/body", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("testUserAdmin", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("add_plugins", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("displayArticle", function(err, el) {
                b.next('isSelected', el, function(err, isSelected) {
                    if (!isSelected) {
                        b.next('clickElement', el, noop);
                    }
                });
            })
            .hasElement(CssSelector,".column.span4.pc1", function(err, bool) {
                expect(bool).to.equal(true);
            })
            .hasElement(CssSelector,".column.span4.pc2", function(err, bool) {
                expect(bool).to.equal(true);
            })
            .hasElement(CssSelector,".column.span4.pc3", function(err, bool) {
                expect(bool).to.equal(true);
            })
            .elementByCssSelector(".displayArticle .tools .remove", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("testUserAdmin", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("site_settings_page", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("Plugins Manager", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByCssSelector(".action-button", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("Uninstall", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("OK", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .hasElement(CssSelector,".alert.alert-success", function(err, bool) {
                expect(bool).to.equal(true);
            })
            .elementByLinkText("NodePortal", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("New page for layout testing", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .hasElement(CssSelector,".column.span4.pc1", function(err, bool) {
                expect(bool).to.equal(false);
            })
            .hasElement(CssSelector,".column.span4.pc2", function(err, bool) {
                expect(bool).to.equal(false);
            })
            .hasElement(CssSelector,".column.span4.pc3", function(err, bool) {
                expect(bool).to.equal(false);
            })
            .elementByLinkText("testUserAdmin", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("site_settings_page", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("Site Pages", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("New page for layout testing", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementById("delete", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .elementByLinkText("OK", function(err, el) {
                b.next('clickElement', el, noop);
            })
            .hasElement(CssSelector,".alert.alert-success ", function(err, bool) {
                expect(bool).to.equal(true);
            })
            .close(function(err) {
                done(err);
            });

    });
});

afterEach(function() {
    b.quit();
});
