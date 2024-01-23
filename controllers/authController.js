const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './../config.env' });
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const cryptop = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // cookie expires in 90 days from now
    // multiply with 24 for days, 60 for hours and minutes, 1000 for milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure option is enabled so that cookie will be only sent over HTTPS connections
    // so cookie will not be sent in local or dev environments
    secure: process.env.NODE_ENV === 'production',
    // httpOnly is enabled to prevent the cookie from being accessed or modified
    // from malicious codes in the browser (for example cross site scripting attacks)
    httpOnly: true,
  };

  // send token as a cookie along with response
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // hide password after sending the cookie

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // store only necessary parts of the req.body for security reasons (prevent users to sign themselves as admin)
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  // use user's mongoDB id as payload of jwt
  // header (auto generated) + payload (first arg) + secret => signature
  // payload + header + signature => jwt (this process happens behind the scene)
  // third arg is option for token expiration
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if the user provide both email and password
  if (!email || !password)
    return next(new AppError('Please provide email and password.', 400));

  // check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  // instance methods are available for every document
  if (
    !user ||
    (await user.correctPassword(password, user.password)) === false
  ) {
    // this error message is surprisingly good for security reasons
    // if attacker input something wrong, then he will not know what is wrong, email or password
    return next(new AppError('Incorrect email or password.', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // check if the token exists in header and if it starts with Bearer
  // this is a standard for sending tokens in header (use Authorization for key and Bearer + ' ' + token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // take the token from authorization header string
  }

  if (!token)
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
    );

  // verify the token if someone manipulated the payload or if the token is expired
  // we need to use await here, so convert the callback based function (verify) into promise based using promisify
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // decoded data

  // check if the user is deleted in the meantime or still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token is no longer exist.', 401),
    );

  // check if the user changed password after the token issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401),
    );
  }

  req.user = currentUser; // update the req.user because it travels through middleware pipeline
  next(); // grant access to protected route
});

// make a wrapper function and return the middleware since we cant pass params to a middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // by the time request reach this middleware, request object will have user object stored
    // because it passed through protect middleware to reach here
    // it's literally checking if the req.user.role includes inside the specified roles passed as argument
    // since the argyment is spreaded, it becomes and array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perfrom this action', 403),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('There is no user with this email.', 404));

  // Generate a random reset token
  const resetToken = user.createPasswordResetToken();

  // We need to call the save method for the database to persist the generated token and its expiration.
  // The fields (passwordResetToken and passwordResetExpires) are modified inside the instance method,
  // but these changes are in-memory. We need to call save method to persist them in the database.
  // Deactivate all the validators in the schema to save the reset token in the database,
  // as the changes made by the instance method may not adhere to schema validation rules.
  await user.save({ validateBeforeSave: false });

  // Send the reset token to user's email
  // basically we're contructing this reset password url to send this guy as email's text message
  // so that the user can click on it, we can show a UI for it if we want to, you know, you get the point
  // and we're getting protocol and host from request so it can work on both dev and prod environments
  const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/reset-password/${resetToken}`;

  console.log('resetUrl: ', resetUrl);

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // if something went wrong, eliminate token and expiration in the database
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email! Try again later.', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  // hash the original token that was sent with the url to compare with one in the database
  const hashedToken = cryptop
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  // find the user with the same token and which is not expired
  // expiration > now => it's in the future (not expired yet)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired!', 400));

  // Change the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // we dont need to turn off validators saving the user data here
  // because we wanna check if password and passwordConfirm are both there
  // that's the whole point of writing all of this isnt it
  await user.save();

  // Log the user in after changing the password
  createSendToken(user, 200, res);
});

// update password for logged iun users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  // get user id from req.user which is provided by protect middleware
  const dbUser = await User.findById(req.user._id).select('+password');

  if (!dbUser)
    return next(new AppError('Missing id or no user found with that id.', 400));

  // Check if POSTed password is correct
  const isCorrect = await dbUser.correctPassword(
    req.body.passwordCurrent,
    dbUser.password,
  );

  if (!isCorrect)
    return next(new AppError('Your current password is wrong.', 401));

  // If so, update the password
  dbUser.password = req.body.password;
  dbUser.passwordConfirm = req.body.passwordConfirm;
  await dbUser.save();

  // Log the user in
  createSendToken(dbUser, 200, res);
});
