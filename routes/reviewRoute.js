const express = require('express');
const {
  getAllReview,
  createReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');
const router = express.Router();

router
  .route('/')
  .get(getAllReview)
  .post(protect, restrictTo('user'), createReview);

module.exports = router;
