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
