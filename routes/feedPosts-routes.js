const express = require("express");
const { check } = require("express-validator");

const feedPostsControllers = require("../controllers/feedPosts-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

/* Make sure user is authorized */
router.use(checkAuth);

router.get("/:userId", feedPostsControllers.getFeedPostsByUserId);

router.get(
  "/following/:userId",
  feedPostsControllers.getFeedPostsFromFollowingByUserId
);

router.post(
  "/:userId",
  check("content").not().isEmpty(),
  feedPostsControllers.addFeedPostByUserId
);

router.delete("/:postId", feedPostsControllers.deleteFeedPostByPostId);

module.exports = router;
