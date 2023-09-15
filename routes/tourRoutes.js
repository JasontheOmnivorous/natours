const express = require('express');
// exports.TourController.controllers => object destructuring
const {getAllTours, createTour, getTour, updateTour, deleteTour, aliasTopTours, getTourStats} = require('./../controllers/tourController');
const router = express.Router(); // create mount router for tours

// // param middleware => a middleware that only runs for certain parameter in the URL
// router.param('id', checkId); 

/* Route Chaining */
// this way, we only have to change the code once let's say when we need to change the route
router 
.route('/top-5-cheap')
.get(aliasTopTours, getAllTours); // route for aliasing

router
.route('/tour-stats')
.get(getTourStats); // route for aggregation

router
   .route('/') // we only need to specify needed routes because the mounting route already got the root path
   .get(getAllTours)
   .post(createTour); // can also chain HTTP verbs

router
   .route('/:id')
   .get(getTour) 
   .patch(updateTour)
   .delete(deleteTour);

module.exports = router; // export our tour route