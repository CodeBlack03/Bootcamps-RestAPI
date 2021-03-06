const jwt = require("jsonwebtoken");
const Users = require("../model/user");
const auth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    //Set authorization From Bearer Token
    token = token.replace("Bearer ", "");

    // Set authorization from cookie
    // token = req.cookie.token;

    // console.log(token);
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const roleOfUser = (await Users.findOne({ _id: decoded._id })).role;

    const user = await Users.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!user && roleOfUser.toLowerCase() !== "admin") {
      throw new Error();
    }

    // Register Cookie for authorization
    // const options = {
    //   expires: new Date(
    //     Date.now() + process.env.AUTH_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    //   ),
    //   httpOnly: true,
    // };
    // if (process.env.NODE_ENV === "production") {
    //   options.secure = true;
    // }
    // res.status(200).cookie("token", token, options);

    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
