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

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document)
      return next(new AppError(`No ${Model} found with that id.`, 400));

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });
};
