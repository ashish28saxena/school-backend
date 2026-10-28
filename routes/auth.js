const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")

const router = express.Router();

// JWT TOKEN GENERATOR
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }

  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    jwtSecret,
    {
      expiresIn: "7d",
    }
  );
};

router.post("/login", async (req, resp) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return resp.send({
                sucess: "fail",
                message: "Email and Password are required"
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return resp.send({
                success: false,
                message: "Invalid Email or Password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return resp.status(401).json({
                success: false,
                message: "Invalid Email or Password"
            });
        }
        const token = generateToken(user);            
        resp.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });




    } catch (error) {

    }
})

router.post("/register", async (req, resp) => {
    try {
        const { name, email, password,gender,phoneNumber,roleId } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            gender,
            phoneNumber,
            roleId

        })

        await user.save();
        const token = generateToken(user);
        resp.status(200).json({
            success: true,
            token
            message: "Login Successful",
            
        });

    } catch (error) {
        console.log(error)
    }



})

module.exports = router;