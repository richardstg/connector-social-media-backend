const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const FeedPost = require("../models/feedPost");
const User = require("../models/user");

/* Get all feedposts from a specific user */
const getFeedPostsByUserId = async (req, res, next) => {
  let feedPosts;

  try {
    feedPosts = await FeedPost.find({ creator: req.params.userId })
      .sort({
        created: -1,
      })
      .populate("creator", "firstName lastName image");
  } catch (err) {
    const error = new HttpError(
      "Fetching feed posts failed, please try again later.",
      500
    );
    return next(error);
  }

  if (feedPosts.length < 1) {
    const error = new HttpError("There are no posts in the feed yet.", 500);
    return next(error);
  }

  res.json({
    feedPosts: feedPosts.map((feedPost) =>
      feedPost.toObject({ getters: true })
    ),
  });
};

/* Get all feedposts from the users that a specific user follows */
const getFeedPostsFromFollowingByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let user;

  // Get the user
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, could not get feed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "User does not exist, could not get feed.",
      500
    );
    return next(error);
  }

  let feedPosts;

  // Get the feed posts from the users that the user follows
  try {
    feedPosts = await FeedPost.find({
      creator: { $in: user.following },
    }).populate("creator", "firstName lastName");
  } catch (err) {
    const error = new HttpError(
      "Fetching feed posts failed, please try again later.",
      500
    );
    return next(error);
  }

  if (feedPosts.length < 1) {
    const error = new HttpError(
      "There are no posts from the users you follow.",
      500
    );
    return next(error);
  }

  res.json({
    feedPosts: feedPosts.map((feedPost) =>
      feedPost.toObject({ getters: true })
    ),
  });
};

/* Add a feedpost */
const addFeedPostByUserId = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.userId;

  // Get the user that created the feedpost, in order to save it to the user-documents feedPost-property
  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Creating feed post failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to create feed posts from this user.",
      401
    );
    return next(error);
  }

  const { content } = req.body;
  const created = new Date();

  let createdFeedPost = new FeedPost({
    content,
    creator: userId,
    created,
  });

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await createdFeedPost.save({ session: sess });
    user.feedPosts.push(createdFeedPost.id);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating feed post failed, please try again.",
      500
    );
    return next(error);
  }

  res.json({
    feedPost: {
      ...createdFeedPost.toObject({ getters: true }),
      creator: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      },
    },
  });
};

// const updateFeedPostByPostId = async (req, res, next) => {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return next(
//       new HttpError("Invalid inputs passed, please check your data.", 422)
//     );
//   }

//   const { userId } = req.body;
//   const postId = req.params.postId;
//   const { content } = req.body;

//   let feedPost;

//   // Find the feedpost to update
//   try {
//     feedPost = await FeedPost.findById(postId);
//   } catch (err) {
//     const error = new HttpError(
//       "Updating feed post failed, please try again later.",
//       500
//     );
//     return next(error);
//   }

//   if (!feedPost) {
//     const error = new HttpError(
//       "Feed post does not exist, could not update.",
//       500
//     );
//     return next(error);
//   }

//   feedPost.content = content;

//   try {
//     await feedPost.save();
//   } catch (err) {
//     const error = new HttpError(
//       "Updating feed post failed, please try again later.",
//       500
//     );
//     return next(error);
//   }

//   res.json({ feedPost: feedPost.toObject({ getters: true }) });
// };

/* Delete a feedpost */
const deleteFeedPostByPostId = async (req, res, next) => {
  const postId = req.params.postId;
  // const { userId } = req.body;

  let feedPost;

  // Find the feedpost to delete, and populate with the user that created it
  try {
    feedPost = await FeedPost.findById(postId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Deleting feed post failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!feedPost) {
    const error = new HttpError(
      "Feed post does not exist, could not delete.",
      500
    );
    return next(error);
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (feedPost.creator.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete the feed post from this user.",
      401
    );
    return next(error);
  }

  // Delete the feed post from feed posts and the user's feedposts
  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await feedPost.remove({ session: sess });
    feedPost.creator.feedPosts.pull(feedPost.id);
    await feedPost.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Deleting feed post failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ feedPost: feedPost.toObject({ getters: true }) });
};

exports.getFeedPostsByUserId = getFeedPostsByUserId;
exports.getFeedPostsFromFollowingByUserId = getFeedPostsFromFollowingByUserId;
exports.addFeedPostByUserId = addFeedPostByUserId;
// exports.updateFeedPostByPostId = updateFeedPostByPostId;
exports.deleteFeedPostByPostId = deleteFeedPostByPostId;
