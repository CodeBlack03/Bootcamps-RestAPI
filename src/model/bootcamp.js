const mongoose = require("mongoose"); // Erase if already required
const validator = require("validator");
const geocoder = require("../utils/geocoder");
const Courses = require("../model/course");
const Reviews = require("./reviews");
// Declare the Schema of the Mongo model
const bootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    website: {
      type: String,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Url not valid!");
        }
      },
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    carrers: {
      type: [String],
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },
    email: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    averageCost: {
      type: Number,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id", //relationship between User and Tasks
  foreignField: "bootcamp",
});

bootcampSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "bootcamp",
});

bootcampSchema.pre("save", async function (next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: "Point",
    coordinates: [loc[0].latitude, loc[0].longitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].state,
    country: loc[0].country,
    zipcode: loc[0].zipcode,
  };
  this.address = undefined;
  next();
});

bootcampSchema.methods.toJSON = function () {
  const bootcamp = this;
  const bootcampObject = bootcamp.toObject();

  delete bootcampObject.id;
  return bootcampObject;
};

bootcampSchema.pre("remove", async function (next) {
  const bootcamp = this;
  const courses = await Courses.deleteMany({ bootcamp: bootcamp._id });
  const reviews = await Reviews.deleteMany({ bootcamp: bootcamp._id });
  next();
});
//Export the model
module.exports = mongoose.model("Bootcamp", bootcampSchema);
