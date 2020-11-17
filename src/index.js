require("dotenv").config({ path: "../config/dev.env" });

const express = require("express");
const request = require("request");
const port = process.env.PORT || 3000;
const bootcampRouter = require("./routers/bootcamp");
const courseRouter = require("./routers/course");
const userRouter = require("./routers/user");
const reviewRouter = require("./routers/review");
const cookieParser = require("cookie-parser");
require("./db/mongoose");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bootcampRouter);
app.use(courseRouter);
app.use(userRouter);
app.use(reviewRouter);
app.listen(port, () => console.log(`Example app listening on port port!`));
