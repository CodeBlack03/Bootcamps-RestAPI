const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,

    index: true,
  },
  text: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  bootcamp: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Bootcamp",
  },
  user: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

reviewSchema.methods.toJSON = function () {
  const review = this;
  const reviewObject = review.toObject();

  delete reviewObject.id;
  return reviewObject;
};

reviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
  console.log(Math.round(obj[0].averageRating * 10) / 10);
  try {
    const bootcamp = await this.model("Bootcamp").findByIdAndUpdate(
      bootcampId,
      { averageRating: Math.round(obj[0].averageRating * 10) / 10 }
    );
  } catch (error) {
    console.log(error);
  }
};

//Call get AverageCourse after save
reviewSchema.post("save", function () {
  Reviews.getAverageRating(this.bootcamp);
});

// Call get AverageCost before remove
reviewSchema.pre("delete", function () {
  Reviews.getAverageRating(this.bootcamp);
});

//Export the model
const Reviews = mongoose.model("Review", reviewSchema);
module.exports = Reviews;
