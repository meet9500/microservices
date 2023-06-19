const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const verifyUser = require("../register-services/authMiddleware");
const Product = require("../register-services/productModel");

const PORT = 3002;
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

app.post("/register/product", verifyUser, async (req, res) => {
  try {
    const { name, quantity } = req.body;

    const product = new Product({
      name: name,
      quantity: quantity,
      userId: req.user.id,
    });

    product.save();
    res.status(200).json({
      message: "product register",
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.post("/product/add-to-cart/:id", verifyUser, async (req, res) => {
  try {
    const productId = req.params;
    const product = await Product.findOne({
      _id: ObjectId(productId),
    });

    if (!product) {
      return res.status(200).json({
        messag: "no product",
      });
    }

    await Product.updateOne(
      {
        _id: ObjectId(productId),
      },
      {
        $inc: {
          quantity: -1,
        },
      }
    );

    const productLeft = product.quantity - 1;

    res.status(200).json({
      message: "product added",
      productLeft,
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.listen(PORT, () => {
  console.log("listing on port=", PORT);
});
