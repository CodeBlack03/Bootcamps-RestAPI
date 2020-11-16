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

//Export the model
module.exports = mongoose.model("Review", reviewSchema);
