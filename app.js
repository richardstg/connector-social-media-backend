const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth-routes");
const usersRoutes = require("./routes/users-routes");
const feedPostsRoutes = require("./routes/feedPosts-routes");
const guestBookMessagesRoutes = require("./routes/guestBookMessages-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/feed-posts", feedPostsRoutes);
app.use("/api/guest-book-messages", guestBookMessagesRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-shard-00-00.0uky0.mongodb.net:27017,cluster0-shard-00-01.0uky0.mongodb.net:27017,cluster0-shard-00-02.0uky0.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-g3eny4-shard-0&authSource=admin&retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Server running on port 5000");
  })
  .catch((err) => {
    console.log(err);
  });
