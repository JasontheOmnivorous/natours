const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    totalReviews: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // take tour from query param if it wasn't specified in the body
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // take logged in user if it doesn't exist in the body
  if (!req.body.user) req.body.user = req.user.id;

  // surprisingly, it's okay to not filter the request body
  // because database will simply ignore non relevant fields in the schema
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      newReview,
    },
  });
});
