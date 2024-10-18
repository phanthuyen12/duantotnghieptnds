const mongoose = require("mongoose");
const orgSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  creationtime: {
    type: String, // Sử dụng Mixed cho dữ liệu không xác định
    require: true,
  },
  fullname: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    required: true,
  },
  typeorg: {
    type: String,
    required: true,
  },
  status:{
    type: String,
    required: true,
  },
  cccd:{
    type: String,
    required: true,
  },
  personalpapers:{
    type: String,
    required: true,
  }
});
const Org = mongoose.model("organization", orgSchema);
module.exports = Org;
