const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReview = catchAsync(async (req, res, next) => {
  let filter = {};
  // when there's tourId in request params,
  // query will find only reviews that are specific to that tourId
  // if not, the object's gonna be undefined and
  // the query will simply find all the reviews
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    totalReviews: reviews.length,
    data: {
      reviews,
    },
  });
});

// use a middleware to set data, so that we can refactory the createReview controller with factory
exports.setTourUserIds = (req, res, next) => {
  // take tour from query param if it wasn't specified in the body
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // take logged in user if it doesn't exist in the body
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
