var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  text: {
    type: String
  },
  user: {
    type: String,
    required: true
  }
})

mongoose.model('comments', commentSchema);