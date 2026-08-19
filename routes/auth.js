const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")

const router = express.Router();

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

        resp.status(200).json({
            success: true,
            message: "Login Successful",
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
        const { name, email, password,gender,phoneNumber } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            gender,
            phoneNumber

        })

        await user.save();
        resp.status(200).json({
            success: true,
            message: "Login Successful",
            
        });

    } catch (error) {
        console.log(error)
    }



})

module.exports = router;