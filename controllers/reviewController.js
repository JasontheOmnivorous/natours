const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// use a middleware to set data, so that we can refactory the createReview controller with factory
exports.setTourUserIds = (req, res, next) => {
  // take tour from query param if it wasn't specified in the body
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // take logged in user if it doesn't exist in the body
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReview = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
