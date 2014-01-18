var update = {
    type: "submit",
    value: "Update"
};
var comments = {
    label: "Enable comments notifications",
    type: "checkbox",
    name: "comments"
};


var userId = {
    type: "hidden",
    name: "userId"
};


module.exports = {
    form: {
        id: "notificationsFM",
        method: "post",
        action: "updateUserNotifications",
        legendText: "Update user notifications"
    },
    fields: [ userId, comments,
        update ]
};