const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document)
      return next(new AppError(`No ${Model} found with that id.`, 400));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};
