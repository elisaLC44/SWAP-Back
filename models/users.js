var mongoose = require("mongoose");

let commentSchema = mongoose.Schema({
    author: String,
    content: String,
    insert_date: Date,
  });

var userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password : String,
    token: String,
    user_img : String,
    user_credit: Number,
    birth_date : Number,
    gender : String,
    bio : String,
    address_street: String,
    address_city: String,
    address_zipcode: String,
    comments: [commentSchema],
    verified_profile: Boolean,
    categories: [{type : String}],
})

// gender: {
    //     type: String,
    //     enum: ["male", "female", "non-binary"],
    //   },
    
var userModel = mongoose.model('users', userSchema)

module.exports = userModel