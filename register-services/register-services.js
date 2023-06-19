const express = require("express");
const bodyParser = require("body-parser");
const User = require("./userModel");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const PORT = 3001;
const app = express();

app.use(bodyParser.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/user-login", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection success");
  });

const transpoert = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "makadiameet4@gmail.com",
    pass: "demo@12",
  },
});

function sendEmail(email, token) {
  const mailOption = {
    from: "makadiameet4@gmail.com",
    to: email,
    subject: "vefification code",
    text: `http://localhost:3000/verify/email?token=${token}&email=${email}`,
  };

  transpoert.sendMail(mailOption, (err, res) => {
    if (err) {
      console.log("error", err);
    } else {
      console.log("mail send");
    }
  });
}

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = User.findOne({
      email,
    });

    if (!existingUser) {
      return res.status(400).send({
        message: "user already register",
      });
    }

    const verification = Math.random();

    const hashPass = await bcrypt.hash(password, 10);

    const user = new User({
      name: name,
      email: email,
      password: hashPass,
      verificationToken: verification,
      isVerified: false,
    });

    user.save();

    sendEmail(email, verification);

    res.status(200).json({
      message: "success register",
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.post("/verify/email", async (req, res) => {
  try {
    const { email, token } = req.query;

    const user = User.findOne({
      email: email,
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        message: "invalid verification",
      });
    }

    await User.updateOne(
      {
        email: email,
      },
      {
        $set: {
          isVerified: true,
        },
      }
    );

    res.status(200).json({
      message: "token verified",
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).send({
        message: "user not found",
      });
    }

    // if (!user.isVerified) {
    //   return res.status(400).send({
    //     message: "user is not verified",
    //   });
    // }

    console.log("insoide============", user);
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return res.status(400).send({
        message: "Invalid user cridential",
      });
    }

    const token = jwt.sign({ email: user.email }, "secretKey", {
      expiresIn: "1h",
    });

    user.tokens = user.tokens.concat({ token });
    await user.save();

    res.status(200).json({
      token: token,
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.listen(PORT, () => {
  console.log("listing on port=", PORT);
});
