const express = require("express");
const bootcamp = require("../model/bootcamp");
const Courses = require("../model/course");
const auth = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.get(
  "/courses",
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
    } catch (err) {
      res.status(500).send({
        error: "Server Error",
      });
    }
  }
);

router.get("/courses/:id", async (req, res) => {
  try {
    const course = Courses.findById(req.params.id)
      .populate("bootcamp", "name description location website")
      .populate("user", "name role email");
    if (!course) {
      return res.status(404).send("No course found!");
    }
    const result = await course;
    res.send(result);
  } catch (error) {
    res.status(401).send(err);
  }
});
router.post("/courses", auth, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "user") {
      return res.status(400).send("User must be an Admin or a Publisher");
    }
    const course = new Courses({ ...req.body, user: req.user._id });
    course.save();
    res.status(201).send(course);
  } catch (error) {
    res.status(401).send(err);
  }
});

router.patch("/courses/:id", auth, async (req, res) => {
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
      return res.status(400).send("You are not authorized to Update a Course");
    }
    const course = await Courses.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("bootcamp", "name website")
      .populate("user", "name role");

    if (!course) {
      return res.status(404).send("No course found!");
    }
    updates.forEach((update) => {
      course[update] = req.body[update];
    });
    course.save();
    res.status(201).send(course);
  } catch (err) {
    res.status(401).send(err);
  }
});

router.delete("/courses/:id", auth, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "user") {
      throw new Error();
    }
    const course = await Courses.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).send("No course found!");
    }
    await course.remove();
    res.status(200).send(course);
  } catch (error) {
    res.status(401).send({
      error: "You are not authorized to delete a Course",
    });
  }
});

module.exports = router;
