const mongoose = require('mongoose');
const Schema = mongooe.Schema;

// Create User Schema
const UserSchema = new Schema({
  name: {
    type: String, 
    require: true  
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Data,
    default: Date.now
  }
});

mongoose.model('users', UserSchema);