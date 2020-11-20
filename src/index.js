require("dotenv").config({ path: "../config/dev.env" });

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const port = process.env.PORT || 3000;
const bootcampRouter = require("./routers/bootcamp");
const courseRouter = require("./routers/course");
const userRouter = require("./routers/user");
const reviewRouter = require("./routers/review");

require("./db/mongoose");

const app = express();

app.use(express.json());

//Cookie
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

//Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

//Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
//Enable CORS
app.use(cors());

app.use(limiter);

//Prevent http param pollution
app.use(hpp());

//Routes
app.use(bootcampRouter);
app.use(courseRouter);
app.use(userRouter);
app.use(reviewRouter);

app.listen(port, () => console.log(`Example app listening on port port!`));
