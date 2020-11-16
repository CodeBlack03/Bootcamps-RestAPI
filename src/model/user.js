const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Bootcamps = require("./bootcamp");
const Courses = require("./course");
const Reviews = require("./reviews");

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,

      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is Invalid!");
        }
      },
    },
    mobile: {
      type: String,

      unique: true,
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Please re create a strong password");
        }
      },
    },
    role: {
      type: String,
      enum: ["user", "publisher"],
      default: "user",
    },

    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
userSchema.virtual("bootcamp", {
  ref: "Bootcamp",
  localField: "_id", //relationship between User and Tasks
  foreignField: "user",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.id;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user.id.toString() }, process.env.AUTH_SECRET, {
    expiresIn: "30 days",
  });

  user.tokens = user.tokens.concat({ token: token });
  //console.log("token", user.tokens);
  //console.log(token);
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await Users.findOne({ email: email });

  if (!user) {
    throw new Error("No user found");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  const bootcamp = await Bootcamps.deleteMany({ user: user._id });
  const course = await Courses.deleteMany({ user: user._id });
  const reviews = await Reviews.deleteMany({ user: user._id });
  next();
});
//Export the model
const Users = mongoose.model("User", userSchema);
module.exports = Users;
