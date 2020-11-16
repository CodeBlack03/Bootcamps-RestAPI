const jwt = require("jsonwebtoken");
const Users = require("../model/user");
const auth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    token = token.replace("Bearer ", "");
    //console.log(token);
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const roleOfUser = (await Users.findOne({ _id: decoded._id })).role;
    //console.log(roleOfUser);

    const user = await Users.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!user && roleOfUser.toLowerCase() !== "admin") {
      throw new Error();
    }
    req.token = token;
    req.user = user;

    next();
  } catch (err) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
