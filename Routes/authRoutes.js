const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({
    windowMs: 15*60*1000,
    max:5,
    message:{ message: 'Too many login attempts. please try again in 15 mins.'}
});

const router = express.Router();

router.post( '/signup', async (req,res) =>{
   try{
    const {name,email,password} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = await User.create({
        name: name,
        email: email,
        password: hashedPassword
    });
    res.status(201).json({ message:'User created successfully', user:newUser });
   }catch (error){
    res.status(500).json({ message:'Signup failed', error: error.message });
   }
});

router.post('/login', loginLimiter , async (req,res) =>{
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email: email});
        if(!user){
            return res.status(401).json({ message:'no user found' });
        }

        const check = await bcrypt.compare(password, user.password);
        
        if(!check){
            return res.status(401).json({ message:'wrong password' });
        }
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(200).json({ message:'Login successful!' , token:token });

    }catch(error){
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});


module.exports = router;