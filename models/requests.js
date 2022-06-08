const mongoose = require("mongoose");

let messageSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  message: String,
  insert_date: Date,
});

let conversationSchema = mongoose.Schema({
  user_conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  messages: [messageSchema],
});


let requestSchema = mongoose.Schema({
  asker_status: Number,
  helper_status: Number,
  category: String,  // { type: mongoose.Schema.Types.ObjectId, ref: "users" } puis path dans la route
  description: String,
  disponibility: String,
  address: {
    address_street: String,
    address_city: String,
    address_zipcode: String,
  },
  insert_date: Date,
  declaration_date: String,
  end_date: String,
  credit: Number,
  helper: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  asker: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  selected_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // tous les helpers sélectionnés par le asker
  willing_helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // tous les helpers souhaitant poursuivre la demande
  conversations: [conversationSchema],
});

let requestModel = mongoose.model("requests", requestSchema);

module.exports = requestModel;