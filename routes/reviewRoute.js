const express = require('express');
const {
  getAllReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');

// this option enables route merging
// so everytime user access /:tourId/reviews endpoint,
// they're gonna be redirected to here
// and every request will be handled here as long as req method matches
// so, because of mergeParams is enabled,
// the reviewRouter's inherits the redirected parent's params
// so at the time the request reaches here,
// the endpoint will be /:tourId/reviews
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReview)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router.route('/:id').get(getReview).patch(updateReview).delete(deleteReview);

module.exports = router;
