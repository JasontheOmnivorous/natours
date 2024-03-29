const express = require('express');
// exports.TourController.controllers => object destructuring
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getSlug,
} = require('./../controllers/tourController');
const { protect, restrictTo } = require('./../controllers/authController');
const router = express.Router(); // create mount router for tours
const reviewRouter = require('./reviewRoute');

// POST => /tour/bfeuwg812e28/reviews
// GET => /tour/bfeuwg812e28/reviews
// GET => /tour/bfeuwg812e28/reviews/kjnueiwh39
// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

// route merging
// this is basically saying, if we encounter an endpoint like this in th request,
// use reviewRouter instead of this tourRouter
// we wanna use reviewRouter here, because it's kinda confusing to use
// tourRouter, even though reviews belong to tour
// so, it's like redirecting
router.use('/:tourId/reviews', reviewRouter);

// // param middleware => a middleware that only runs for certain parameter in the URL
// router.param('id', checkId);

/* Route Chaining */
// this way, we only have to change the code once let's say when we need to change the route
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); // route for aliasing

// router
// .route('/:slug')
// .get(getSlug)

router.route('/stats').get(getTourStats); // route for aggregation

router.route('/monthly-plan/:year').get(getMonthlyPlan);

router
  .route('/') // we only need to specify needed routes because the mounting route already got the root path
  .get(protect, getAllTours) // protect seeing all tours from unauthorized user
  .post(createTour); // can also chain HTTP verbs

router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router; // export our tour route
