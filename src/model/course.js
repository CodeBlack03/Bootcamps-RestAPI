const mongoose = require("mongoose"); // Erase if already required
const Bootcamps = require("./bootcamp");
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

//Static method to get average of course tuitions
courseSchema.statics.getAverageCost = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);
  try {
    const bootcamp = await this.model("Bootcamp").findByIdAndUpdate(
      bootcampId,
      { averageCost: Math.ceil(obj[0].averageCost / 10) * 10 },
      { new: true, runValidators: true }
    );
  } catch (error) {
    console.log(error);
  }
};

//Call get AverageCourse after save
courseSchema.post("save", function () {
  Courses.getAverageCost(this.bootcamp);
});

// Call get AverageCost before remove
courseSchema.pre("delete", function () {
  Courses.getAverageCost(this.bootcamp);
});

courseSchema.methods.toJSON = function () {
  const course = this;
  const courseObject = course.toObject();

  delete courseObject.id;
  return courseObject;
};

//Export the model
const Courses = mongoose.model("Course", courseSchema);
module.exports = Courses;
