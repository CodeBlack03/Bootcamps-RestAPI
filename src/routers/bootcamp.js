const express = require("express");
const geocoder = require("../utils/geocoder");
const Bootcamps = require("../model/bootcamp");
const auth = require("../middleware/auth");
const router = new express.Router();

router.get("/bootcamps", async (req, res) => {
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
    let bootcamps = Bootcamps.find(JSON.parse(queryStr))
      .populate({
        path: "user",
      })
      .populate("reviews")
      .populate("courses");

    //pagination
    let pagination;
    const page = query.page || 1;
    const limit = query.limit || 10;

    const totalDocuments = await Bootcamps.countDocument;

    //   if (firstPage > 0) {
    //     pagination.next(page + 1);
    //   }
    //   if (lastPage < totalDocuments) {
    //     pagination.pre(page - 1);
    //   }
    bootcamps.skip((page - 1) * limit).limit(limit);
    bootcamps.select(query.select);
    //Sort
    if (query.sort) {
      const sortBy = query.sort.split(",").join(" ");
      bootcamps.sort(sortBy);
    } else {
      bootcamps.sort("-createdAt");
    }
    const result = await bootcamps;
    res.send(result);
  } catch (error) {
    res.send(401).send(error);
  }
});

router.get("/bootcamps/getbyradius", async (req, res) => {
  try {
    const { zipcode, distance } = req.query;
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;
    console.log(loc[0]);
    const radius = distance / 3963;
    const bootcamps = await Bootcamps.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    console.log("Bootcamps", bootcamps);
    res.status(200).send(bootcamps);
  } catch (err) {
    console.log(err);
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
    console.log(err);
    res.status(500).send(err);
  }
});

router.delete("/bootcamps/:id", auth, async (req, res) => {
  try {
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
