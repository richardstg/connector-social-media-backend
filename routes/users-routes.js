const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const router = express.Router();
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

/* Make sure user is authorized */
router.use(checkAuth);

/* Get all users */
router.get("/", usersControllers.getUsers);

/* Get user by user id */
router.get("/:userId", usersControllers.getUserById);

// /* Update a users personal information by user id */
// router.post(
//   "/:userId",
//   fileUpload.single("image"),
//   [
//     check("firstName").not().isEmpty(),
//     check("lastName").not().isEmpty(),
//     check("gender").not().isEmpty(),
//     check("description").not().isEmpty(),
//     check("birthDate").isLength({ min: 10, max: 10 }),
//   ],
//   usersControllers.updateUserById
// );

/* Update a users image by user id */
router.post(
  "/image/:userId",
  fileUpload.single("image"),
  usersControllers.updateUserImage
);

/* Update a users personal information by user id */
router.post(
  "/info/:userId",
  [
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("gender").not().isEmpty(),
    check("description").not().isEmpty(),
    check("birthDate").isLength({ min: 10, max: 10 }),
  ],
  usersControllers.updateUserInfo
);

/* Delete user by user id */
// router.delete("/:userId", usersControllers.deleteUserById);

/* Follow a user by user id */
router.post("/follow/:userToFollowId", usersControllers.followUserById);

/* Unfollow a user by user id */
router.delete("/follow/:userToUnfollowId", usersControllers.unfollowUserById);

/* Unfollow a user by user id */
// router.delete("/", usersControllers.deleteUserById);

module.exports = router;
