const express = require("express");
const auth = require("../middleware/auth");
const Users = require("../model/user");
const router = new express.Router();

router.post("/users", async (req, res) => {
  try {
    const user = new Users(req.body);
    const token = await user.generateAuthToken(); //always use await when promise is returned
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/users/login", async (req, res) => {
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

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send("Successfully logged out!");
  } catch (err) {
    res.status(500).send("Something went wrong, try again");
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "role"];
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

router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);
    await user.remove();
    res.send(user);
  } catch (err) {
    res.status(401).send(err);
  }
});

module.exports = router;
