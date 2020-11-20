const express = require("express");
const Reviews = require("../model/reviews");
const auth = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.get("/reviews/bootcamp/:bootcampId", async (req, res) => {
  try {
    const reviews = await Reviews.find({ bootcamp: req.params.bootcampId });
    if (!reviews) {
      return res.status(404).send("No reviews found");
    }
    res.status(200).send(reviews);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get(
  "/reviews",
  advancedResults(Bootcamps, [
    {
      path: "bootcamps",
      select: "name website averageRating",
    },
    {
      path: "user",
      select: "name role email",
    },
  ]),
  async (req, res) => {
    try {
      res.send(res.advancedResults);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

router.get("/reviews/:id", async (req, res) => {
  try {
    const review = await Reviews.findById(req.params.id);
    if (!review) {
      return res.status(404).send("No review found");
    }
    res.send(review);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/reviews", auth, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "publisher") {
      return res.status(400).send("User must be an Admin or a User");
    }
    const review = new Reviews({ ...req.body, user: req.user._id });
    await review.save();
    res.status(201).send(review);
  } catch (err) {
    res.status(401).send(err);
  }
});

router.patch("/reviews/:id", auth, async (req, res) => {
  const updates = await Object.keys(req.body); //convert object to an array of properties
  const allowedUpdates = ["title", "description", "minimumSkill"];

  const isValidOperation = updates.every(
    (update) => allowedUpdates.includes(update)
    //console.log(allowedUpdates.includes(update) + " " + update);
  );
  if (!isValidOperation) {
    return res.status(400).send("Invalid Operation!");
  }
  const id = req.params.id;
  try {
    if (req.user.role.toLowerCase() === "user") {
      return res.status(400).send("You are not authorized to update a Review");
    }
    const review = await Reviews.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("bootcamp", "name website")
      .populate("user", "name role email");
    if (!review) {
      return res.status(404).send("No review found!");
    }
    updates.forEach((update) => {
      review[update] = req.body[update];
    });
    review.save();
    res.status(200).send(review);
  } catch (error) {
    res.status(401).send(error);
  }
});

router.delete("/reviews/:id", auth, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "publisher") {
      return res.status(400).send("You are not authorized to delete a Review");
    }
    const review = await Reviews.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!review) {
      return res.status(404).send("No review found!");
    }

    await review.remove();
    res.send(review);
  } catch (error) {
    res.status(401).send(error);
  }
});

module.exports = router;
