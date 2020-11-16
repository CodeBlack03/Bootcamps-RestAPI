const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,

    index: true,
  },
  description: {
    type: String,
  },
  weeks: {
    type: Number,
  },
  tuition: {
    type: Number,
  },
  minimumSkill: {
    type: String,
  },
  scholarhipsAvailable: {
    type: Boolean,
  },
  bootcamp: {
    type: mongoose.Types.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

courseSchema.methods.toJSON = function () {
  const course = this;
  const courseObject = course.toObject();

  delete courseObject.id;
  return courseObject;
};

//Export the model
module.exports = mongoose.model("Course", courseSchema);
