const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const feedPostSchema = new Schema({
  content: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  created: { type: Date, required: true, trim: true },
});

module.exports = mongoose.model("FeedPost", feedPostSchema);
