const express = require("express");
const { check } = require("express-validator");

const guestBookMessagesControllers = require("../controllers/guestBookMessages-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

/* Make sure user is authorized */
router.use(checkAuth);

/* Get guest book messages received by the user with the id of :receiverId */
router.get(
  "/:receiverId",
  guestBookMessagesControllers.getGuestBookMessagesByUserId
);

/* Post guest book message to user with the id of :receiverId */
router.post(
  "/:receiverId",
  // check("content").not().isEmpty(),
  // check("senderId").not().isEmpty(),
  guestBookMessagesControllers.addGuestBookMessageByUserId
);

// router.patch("/:postId", feedPostsControllers.updateFeedPostByPostId);

/* Delete guest book message with the id of :messageId */
router.delete(
  "/:messageId",
  guestBookMessagesControllers.deleteGuestBookMessageById
);

module.exports = router;
