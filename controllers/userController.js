const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const finalObj = {};

  // Iterate through each key in the request body object (obj)
  // If the current key exists in the allowedFields parameter array,
  // add that key-value pair to the final object
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      finalObj[item] = obj[item];
    }
  });

  return finalObj; // return final filtered object
};

// route handlers/controllers for users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    totalUsers: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  if (!newUser) return next(new AppError('Fail to create new user.', 400));

  res.status(201).json({
    status: 'success',
    newUser,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new AppError('No users found with that id.', 400));

  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) return new AppError('Cannot find user.', 400);

  res.status(204).json({
    status: 'success',
    message: null,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password related operations. Please use /update-my-password endpoint.',
        400,
      ),
    );
  }
  // Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});
