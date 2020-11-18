const crypto = require("crypto");
const express = require("express");
const auth = require("../middleware/auth");
const Users = require("../model/user");
const router = new express.Router();
const sendEmail = require("../utils/sendEmail");
router.post("/user", async (req, res) => {
  try {
    const user = new Users(req.body);
    const token = await user.generateAuthToken(); //always use await when promise is returned
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await Users.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user: user, token });
  } catch (err) {
    res.status(400).send("Incorrect credentials");
  }
});

router.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    await req.user.save();

    res.send("Successfully logged out!");
  } catch (err) {
    res.status(500).send("Something went wrong, try again");
  }
});

router.get("/user/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/user/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "role"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  ); //Update allowed or not
  if (!isValidOperation) {
    return res.status(400).send({
      error: "Invalid Updates!",
    });
  }

  try {
    const id = req.user._id;
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    // const user = await Users.findByIdAndUpdate(id, req.body, {
    //   new: true, //return new user after update
    //   runValidators: true, //run validations after update
    // });

    res.status(200).send(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.put("/user/updatepassword", auth, async (req, res) => {
  // const user = Users.findById(req.user._id).select("+password");
  const user = await Users.findByCredentials(
    req.user.email,
    req.body.currentPassword
  );

  //Check current password
  if (!user) {
    return res.status(401).send({ error: "Password Incorrect" });
  }
  user.password = req.body.newPassword;
  await user.save({ validateBeforeSave: false });
  res.status(200).send(user);
});

router.delete("/user/me", auth, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);
    await user.remove();
    res.send(user);
  } catch (err) {
    res.status(401).send(err);
  }
});

router.post("/user/forgotpassword", auth, async (req, res) => {
  const user = await Users.findOne({ email: req.body.email });
  // console.log(user);
  if (!user) {
    return res.status(404).send({ error: "No user Found!" });
  }

  //Get reset token
  const resetToken = user.getPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/auth/user/resetpassword/${resetToken}`;
  const message = `You are receiving this email because you have requested the reset of a password.
   Please make a PUT request to: \n\n ${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });
    res.status(200).send("email Sent");
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).send("Email couldn't be sent");
  }
});

router.put("/auth/user/resetpassword/:resetToken", auth, async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");
    const user = await Users.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error();
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(204).send("Password updated Successfully");
  } catch (err) {
    res.status(400).send({ error: "Invalid Token" });
  }
});
module.exports = router;
