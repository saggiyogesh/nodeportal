//"np-model-" should be appended before model conf to recognize &
// build services per modelconf in services folder
// watches for this file & update service accordingly
module.exports = {
    "name": "Car",
    "base": "PersistedModel",
    "options": {
        "mysql": {
            "table": "test_car"
        },
        "mongodb": {
            "collection": "car"
        },
        "oracle": {
            "schema": "DEMO",
            "table": "PRODUCT"
        }
    },
    "properties": {
        "carId": {
            "type": "string",
            "id": true
        },
        "year": {
            "type": "number"
        },
        "make": {
            "type": "string"
        },
        "model": {
            "type": "string"
        },
        "color": {
            "type": "string"
        }
    },
    finders: {
        getCarByModel: {
            arguments: ["model"], // default []
            query: {where: {model: "$model"}, order: "model ASC" }, // $model is placeholder to replace the model in code text
            method: "find",  // options : findOne || find ,  default find
            pagination: true // generates methods useful for paging having start & next method, default false
        }
    }
}