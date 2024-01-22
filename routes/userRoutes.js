const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('./../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require('./../controllers/authController');
const { updateMany } = require('../models/userModel');
// Routes
const router = express.Router(); // create mount router for users

// route chaining for users
router.route('/signup').post(signup);

router.route('/login').post(login);

router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:resetToken').patch(resetPassword);

router.route('/update-my-password').patch(protect, updatePassword);

router.route('/update-me').patch(protect, updateMe);

router.route('/delete-me').delete(protect, deleteMe);

router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
