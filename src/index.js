const express = require("express");
const request = require("request");
const port = 3000;
const bootcampRouter = require("./routers/bootcamp");
const courseRouter = require("./routers/course");
const userRouter = require("./routers/user");
const reviewRouter = require("./routers/review");
require("./db/mongoose");
require("dotenv").config({ path: "./config/.env" });

const app = express();

app.use(express.json());
app.use(bootcampRouter);
app.use(courseRouter);
app.use(userRouter);
app.use(reviewRouter);
app.listen(port, () => console.log(`Example app listening on port port!`));
