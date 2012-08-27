/**
 * 
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var counterSchema = new Schema({
    counter: { type: Number, "default" : 0, unique: true} 
});


//
//counterSchema.statics.increment = function ( callback) {
//    this.count({}, function(cur) {
//	console.log("cur: "+cur);
//	new counterSchema({counterId: ++cur}).save();
//    });
//};


module.exports = mongoose.model('Counter', counterSchema);