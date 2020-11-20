const express = require("express");
const geocoder = require("../utils/geocoder");
const Bootcamps = require("../model/bootcamp");
const auth = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = new express.Router();

router.get(
  "/bootcamps",
  advancedResults(Bootcamps, [
    {
      path: "courses",
      select: "title description tuition",
    },
    {
      path: "user",
      select: "name role email",
    },
    {
      path: "reviews",
    },
  ]),
  async (req, res) => {
    try {
      res.send(res.advancedResults);
    } catch (error) {
      console.log(error);
      res.send(401).send(error);
    }
  }
);

router.get("/bootcamps/getbyradius", async (req, res) => {
  try {
    const { zipcode, distance } = req.query;
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;
    const radius = distance / 3963;
    const bootcamps = await Bootcamps.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).send(bootcamps);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/bootcamps/:id", async (req, res) => {
  try {
    const bootcamp = await Bootcamps.findById(req.params.id)
      .populate("reviews")
      .populate("courses");
    if (!bootcamp) {
      return res.status(404).send("No bootcamp found");
    }
    res.status(200).send(bootcamp);
  } catch (err) {
    res.status(401).send(err);
  }
});

router.post("/bootcamps", auth, async (req, res) => {
  try {
    const existingBootcamp = await Bootcamps.findOne({
      user: req.user._id,
    });
    if (req.user.role.toLowerCase() === "user") {
      return res
        .status(400)
        .send({ error: "User must be an Admin or a Publisher" });
    }
    if (existingBootcamp && req.user.role !== "admin") {
      return res
        .status(400)
        .send({ error: "Publisher can have only one bootcamp" });
    }
    const bootcamp = new Bootcamps({ ...req.body, user: req.user._id });

    bootcamp.save();
    res.status(201).send(bootcamp);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete("/bootcamps/:id", auth, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() === "user") {
      return res
        .status(400)
        .send("You are not authorized to delete a Bootcamp");
    }
    const bootcamp = await Bootcamps.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    console.log(bootcamp);
    if (!bootcamp) {
      return res.status(404).send({ error: "No bootcamp found!" });
    }
    await bootcamp.remove();
    res.status(200).send(bootcamp);
  } catch (error) {
    res.status(401).send(error);
  }
});

router.patch("/bootcamps/:id", auth, async (req, res) => {
  const updates = await Object.keys(req.body); //convert object to an array of properties
  const allowedUpdates = ["name", "email", "address"];

  const isValidOperation = updates.every(
    (update) => allowedUpdates.includes(update)
    //console.log(allowedUpdates.includes(update) + " " + update);
  );
  if (!isValidOperation) {
    return res.status(400).send("Invalid Operation!");
  }
  const id = req.params.id;

  try {
    const bootcamp = await Bootcamps.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({ path: "user" });

    if (!bootcamp) {
      res.status(404).send();
    }
    updates.forEach((update) => {
      bootcamp[update] = req.body[update];
    });
    await bootcamp.save();
    res.status(201).send(bootcamp);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/bootcamps/getAverageCost/:id", async (req, res) => {
  const courses = await Courses.find({
    bootcamp: req.params.id,
    user: req.user._id,
  });
});

router.get("bootcamps/getAverageRating/:id", async (req, res) => {});

module.exports = router;
