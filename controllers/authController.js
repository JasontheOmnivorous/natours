const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {
  // store only necessary parts of the req.body for security reasons (prevent users to sign themselves as admin)
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }  
    });
});