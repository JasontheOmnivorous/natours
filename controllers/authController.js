const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './../config.env' });
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  // store only necessary parts of the req.body for security reasons (prevent users to sign themselves as admin)
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });
    // use user's mongoDB id as payload of jwt
    // header (auto generated) + payload (first arg) + secret => signature
    // payload + header + signature => jwt (this process happens behind the scene)
    // third arg is option for token expiration
    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }  
    });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if the user provide both email and password
  if (!email || !password) return next(new AppError('Please provide email and password.', 400));

  // check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  // instance methods are available for every document
  if (!user || await user.correctPassword(password, user.password) === false) {
    // this error message is surprisingly good for security reasons
    // if attacker input something wrong, then he will not know what is wrong, email or password
    return next(new AppError('Incorrect email or password.', 401 ));
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  })
});