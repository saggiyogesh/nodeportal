var defaultL = {
    layoutId: "c",
    name: "2-col-70-30",
    path: 'shell/layout/index',
    placeHolderNames: [ "col1HTMLTMPL", "col2HTMLTMPL" ]
};

var oneCol = {
    layoutId: "c",
    name: "1-col",
    path: 'shell/layout/1-column',
    placeHolderNames: [ "col1HTMLTMPL"]
};

module.exports = {Layout: [defaultL, oneCol]};