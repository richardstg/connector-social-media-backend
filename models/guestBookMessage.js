const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const guestBookMessageSchema = new Schema({
  sender: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  receiver: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  content: { type: String, required: true },
  created: { type: Date, required: true, trim: true },
  answerTo: {
    type: mongoose.Types.ObjectId,
    ref: "GuestBookMessage",
  },
});

module.exports = mongoose.model("GuestBookMessage", guestBookMessageSchema);
