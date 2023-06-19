const jwt = require("jsonwebtoken");
const User = require("./userModel");
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/user-login", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection success");
  });
const verifyUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "secretKey");
    console.log("====", decoded.email);
    const user = await User.findOne({
      email: decoded.email,
      "tokens.token": token,
    });

    if (!user) {
      console.log("error");
      throw new Error();
    }
    req.user = user;

    next();
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = verifyUser;
