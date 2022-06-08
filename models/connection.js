var mongoose = require("mongoose");

var options = {
  connectTimeoutMS: 5000,
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

mongoose.connect(
  "mongodb+srv://ElisaLC:Moniquedenoual1!mon@cluster0.xmvin.mongodb.net/SWAP-Elisa?retryWrites=true&w=majority",
  options,

  function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("DAAAAM! you look good");
    }
  }
);

module.exports = mongoose;

// test