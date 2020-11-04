const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const User = require("../models/user");

/* Get all users */
const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }

  if (users.length < 1) {
    const error = new HttpError("There are no users yet.", 500);
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

/* Get user by user id */
const getUserById = async (req, res, next) => {
  const userId = req.params.userId;

  let user;

  try {
    user = await User.findById(userId, "-password").populate(
      "following",
      "firstName lastName image"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User does not exist.", 500);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

/* Update a users personal image by user id */
const updateUserImage = async (req, res, next) => {
  const userId = req.params.userId;

  let user;

  try {
    user = await User.findById(userId, "-password").populate(
      "following",
      "firstName lastName image"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "No user found for the user id. Could not update user.",
      404
    );
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this user.", 401);
    return next(error);
  }

  let image;

  if (req.file) {
    image = req.file.path.replace(/\\/g, "/");
  }

  user.image = image;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

/* Update a users personal information by user id */
const updateUserInfo = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.userId;
  const { firstName, lastName, birthDate, gender, description } = req.body;

  let user;

  try {
    user = await User.findById(userId, "-password").populate(
      "following",
      "firstName lastName image"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "No user found for the user id. Could not update user.",
      404
    );
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this user.", 401);
    return next(error);
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.birthDate = birthDate;
  user.gender = gender;
  user.description = description;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

/* Follow a user by user id */

const followUserById = async (req, res, next) => {
  const userToFollowId = req.params.userToFollowId;
  const authUserId = req.userData.userId;

  let userToFollow;

  // Check if the user to follow exists
  try {
    userToFollow = await User.findById(
      userToFollowId,
      "firstName lastName image"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not follow user.",
      500
    );
    return next(error);
  }

  if (!userToFollow) {
    const error = new HttpError(
      "The user you wish to follow does not exist.",
      404
    );
  }

  let authUser;

  // Get the authorized user that wants to follow
  try {
    authUser = await User.findById(authUserId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not follow user.",
      500
    );
    return next(error);
  }

  if (!authUser) {
    const error = new HttpError("Authorized user does not exist.", 404);
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (authUser.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to follow from this user.",
      401
    );
    return next(error);
  }

  // Check that the authorized user does not already follow the user
  if (authUser.following.includes(userToFollowId)) {
    const error = new HttpError("You are already following this user.", 401);
    return next(error);
  }

  try {
    authUser.following.push(userToFollowId);
    await authUser.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not follow user.",
      500
    );
    return next(error);
  }

  res.json({ user: userToFollow.toObject({ getters: true }) });
};

/* Unfollow a user by user id */

const unfollowUserById = async (req, res, next) => {
  const userToUnfollowId = req.params.userToUnfollowId;
  const authUserId = req.userData.userId;

  let userToUnfollow;

  // Check if the user to unfollow exists
  try {
    userToUnfollow = await User.findById(
      userToUnfollowId,
      "firstName lastName image"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not unfollow user.",
      500
    );
    return next(error);
  }

  if (!userToUnfollow) {
    const error = new HttpError(
      "The user you wish to unfollow does not exist.",
      404
    );
  }

  let authUser;

  // Get the authorized user
  try {
    authUser = await User.findById(authUserId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not unfollow user.",
      500
    );
    return next(error);
  }

  if (!authUser) {
    const error = new HttpError("Authorized user does not exist.", 404);
  }

  // Check that the token contains the correct user id for whom the changes are to be made
  if (authUser.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to unfollow from this user.",
      401
    );
    return next(error);
  }

  // Check that the authorized user follows the user and then delete it
  if (authUser.following.includes(userToUnfollowId)) {
    authUser.following.pull(userToUnfollowId);

    try {
      await authUser.save();
    } catch (err) {
      const error = new HttpError(
        "Something went wrong, could not unfollow user.",
        500
      );
      return next(error);
    }
  }

  res.json({ user: userToUnfollow.toObject({ getters: true }) });
};

/* Delete a user by user id */

// const deleteUserById = async (req, res, next) => {
//   const userToDeleteId = req.params.userToDeleteId;
//   const authUserId = req.userData.userId;

//   let userToDelete;

//   // Check if the user to delete exists
//   try {
//     userToDelete = await User.findById(userToDeleteId);
//   } catch (err) {
//     const error = new HttpError(
//       "Something went wrong, could not delete user.",
//       500
//     );
//     return next(error);
//   }

//   if (!userToDelete) {
//     const error = new HttpError(
//       "The user you wish to delete does not exist.",
//       404
//     );
//   }

//   let usersFollowing;

//   // Get all the users that follows the user
//   try {
//     // usersFollowing = await User.find({ following: userToDeleteId });
//     usersFollowing = await User.find({ following: { $all: [userToDeleteId] } });
//   } catch (err) {
//     const error = new HttpError(
//       "Something went wrong, could not delete user.",
//       500
//     );
//     return next(error);
//   }

//   // User.findOneAndUpdate({ following: userToDeleteId },{ $pull: { following: userToDeleteId } },{ multi: true });

//   // User.updateMany(
//   //   { watchlist: { $in: res } }, /** get users who have listings ids  */
//   //   {$pullAll : { watchlist : res } } /** pull all listing ids */
//   // );

//   // User.updateMany(
//   //   { following: { userToDeleteId } } /** get users who have listings ids  */,
//   //   { $pullAll: { following: userToDeleteId } } /** pull all listing ids */
//   // );

//   console.log(usersFollowing);
//   // Delete user from user collection and from the users' "following" arrays
//   // try {
//   //   const sess = await mongoose.startSession();

//   //   sess.startTransaction();

//   //   await userToDelete.remove({ session: sess });
//   //   usersFollowing.following.pull(userToDeleteId);
//   //   await usersFollowing.save({ session: sess });

//   //   await sess.commitTransaction();
//   // } catch (err) {
//   //   const error = new HttpError(
//   //     "Something went wrong, could not delete user.",
//   //     500
//   //   );
//   //   return next(error);
//   // }

//   // res.json({ user: userToDelete.toObject({ getters: true }) });
// };

exports.getUsers = getUsers;
exports.getUserById = getUserById;
// exports.updateUserById = updateUserById;
exports.updateUserImage = updateUserImage;
exports.updateUserInfo = updateUserInfo;
exports.followUserById = followUserById;
exports.unfollowUserById = unfollowUserById;
// exports.deleteUserById = deleteUserById;
