const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './../config.env' });
const AppError = require('./../utils/appError');
const { promisify } = require('util');

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
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt
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

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // check if the token exists in header and if it starts with Bearer
  // this is a standard for sending tokens in header (use Authorization for key and Bearer + ' ' + token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // take the token from authorization header string
  }

  if (!token) return next(new AppError('You are not logged in. Please log in to get access.', 401));

  // verify the token if someone manipulated the payload or if the token is expired
  // we need to use await here, so convert the callback based function (verify) into promise based using promisify
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // decoded data
  
  // check if the user is deleted in the meantime or still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('The user belonging to this token is no longer exist.', 401));
  
  // check if the user changed password after the token issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(new AppError('User recently changed password. Please log in again.', 401));
  }

  req.user = currentUser; // update the req.user because it travels through middleware pipeline
  next(); // grant access to protected route
});