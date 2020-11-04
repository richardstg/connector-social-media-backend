const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const GuestBookMessage = require("../models/guestBookMessage");
const User = require("../models/user");

/* Get all guest book messages for a specific user */
const getGuestBookMessagesByUserId = async (req, res, next) => {
  let guestBookMessages;

  try {
    guestBookMessages = await GuestBookMessage.find({
      receiver: req.params.receiverId,
    })
      .sort({ created: -1 })
      .populate("sender", "firstName lastName image")
      .populate("receiver", "firstName lastName image");
  } catch (err) {
    const error = new HttpError(
      "Fetching guest book messages failed, please try again later.",
      500
    );
    return next(error);
  }

  if (guestBookMessages.length < 1) {
    const error = new HttpError("There are no guest book messages yet.", 500);
    return next(error);
  }

  res.json({
    guestBookMessages: guestBookMessages.map((guestBookMessage) =>
      guestBookMessage.toObject({ getters: true })
    ),
  });
};

/* Add a guest book message */
const addGuestBookMessageByUserId = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { senderId, content, answerTo } = req.body;
  const receiverId = req.params.receiverId;

  // Get the user that sends the message
  let user;

  try {
    user = await User.findById(senderId);
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, could not send message, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "User does not exist, could not send message.",
      500
    );
    return next(error);
  }

  // Check that the token contains the correct user id so that the sender is authorized
  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to send messages from this user.",
      401
    );
    return next(error);
  }

  const created = new Date();

  const createdGuestBookMessage = new GuestBookMessage({
    sender: senderId,
    receiver: receiverId,
    content,
    created,
    answerTo,
  });

  try {
    createdGuestBookMessage.save();
  } catch (err) {
    const error = new HttpError(
      "Sending guest book message failed, please try again.",
      500
    );
    return next(error);
  }

  res.json({
    guestBookMessage: {
      ...createdGuestBookMessage.toObject({ getters: true }),
      sender: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      },
    },
  });
};

/* Delete a guest book message */
const deleteGuestBookMessageById = async (req, res, next) => {
  const messageId = req.params.messageId;

  let guestBookMessage;

  // Find the message to delete, and populate with the user that created it
  try {
    guestBookMessage = await GuestBookMessage.findById(messageId);
  } catch (err) {
    const error = new HttpError(
      "Deleting feed post failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!guestBookMessage) {
    const error = new HttpError(
      "Message does not exist, could not delete.",
      500
    );
    return next(error);
  }

  // Check that the token contains the user id that is required to delete the message
  if (
    guestBookMessage.sender.toString() !== req.userData.userId &&
    guestBookMessage.receiver.toString() !== req.userData.userId
  ) {
    const error = new HttpError(
      "You are not allowed to delete the message.",
      401
    );
    return next(error);
  }

  // Delete the message
  try {
    await guestBookMessage.remove();
  } catch (err) {
    const error = new HttpError(
      "Deleting message failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ guestBookMessage: guestBookMessage.toObject({ getters: true }) });
};

exports.getGuestBookMessagesByUserId = getGuestBookMessagesByUserId;
exports.addGuestBookMessageByUserId = addGuestBookMessageByUserId;
exports.deleteGuestBookMessageById = deleteGuestBookMessageById;
