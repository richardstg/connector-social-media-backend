const express = require("express");
const { check } = require("express-validator");

const authControllers = require("../controllers/auth-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("birthDate").isLength({ min: 10, max: 10 }),
    check("gender").not().isEmpty(),
    check("email")
      .normalizeEmail({
        gmail_remove_dots: false,
      })
      .isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  authControllers.signup
);

router.post("/login", authControllers.login);

module.exports = router;
