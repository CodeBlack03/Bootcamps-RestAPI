const express = require("express");
const Reviews = require("../model/reviews");
const auth = require("../middleware/auth");
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

router.get("/reviews", async (req, res) => {
  try {
    const excludeQuery = ["select", "sort", "page", "limit"];

    let reqQuery = { ...req.query };
    excludeQuery.forEach((q) => {
      delete reqQuery[q];
    });
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );
    let query = req.query;
    const reviews = Reviews.find(JSON.parse(queryStr))
      .populate("bootcamp", "name website")
      .populate("user", "name role email");
    let pagination;
    const page = query.page || 1;
    const limit = query.limit || 10;

    const totalDocuments = await Reviews.countDocument;

    //   if (firstPage > 0) {
    //     pagination.next(page + 1);
    //   }
    //   if (lastPage < totalDocuments) {
    //     pagination.pre(page - 1);
    //   }
    reviews.skip((page - 1) * limit).limit(limit);
    reviews.select(query.select);
    //Sort
    if (query.sort) {
      const sortBy = query.sort.split(",").join(" ");
      reviews.sort(sortBy);
    } else {
      reviews.sort("-createdAt");
    }
    const result = await reviews;
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

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
    const review = await Reviews.create({ ...req.body, user: req.user._id });
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
    const review = await Reviews.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    console.log(review);
    if (!review) {
      return res.status(404).send("No review found!");
    }

    await review.remove();
    res.status(200).send(review);
  } catch (error) {
    console.log(error);
    res.status(401).send(error);
  }
});

module.exports = router;
