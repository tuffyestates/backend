const mongoose = require('mongoose');
const Schema = mongooe.Schema;

// Create User Schema
const UserSchema = new Schema({
  title: {
    type: String, 
    require: true  
  },
  price: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  date: {
    type: Data,
    default: Date.now
  }
});

mongoose.model('users', UserSchema);