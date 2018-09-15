const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Property Schema
const PropertyShema = new Schema({
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    require: true
  },
  image: {
    type: String,
    required: true
  },
  //store videos?
  user: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }

})