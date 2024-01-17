// seperate error handling with actual controller functionality
module.exports = (fn) => {
  // We need another callback function to wrap it in order for Express to call the actual function
  /* 
    So the steps are:
    pass controller function as catchAsync's argument (same as calling it) => go inside catchAsync => 
    return a anonymous callback which actually contains functionalities and data from passed argument (controller)
    and catching mechanism => save this anonymous callback as createTour and export it
    */
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
