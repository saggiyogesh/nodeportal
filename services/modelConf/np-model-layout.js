module.exports = {
    name: "Counter",
    base: "PersistedModel",
    properties: {
        counter: { type: Number, index: true, "default": 0 }
    }
};