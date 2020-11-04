const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true, trim: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: false },
  description: { type: String, required: false },
  following: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  feedPosts: [
    { type: mongoose.Types.ObjectId, required: true, ref: "FeedPosts" },
  ],
  guestBookMessagesReceived: [
    { type: mongoose.Types.ObjectId, required: true, ref: "GuestBookMessage" },
  ],
  guestBookMessagesSent: [
    { type: mongoose.Types.ObjectId, required: true, ref: "GuestBookMessage" },
  ],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
