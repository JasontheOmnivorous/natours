const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  // manipulate the query object in the middleware, so that it's already different when it reaches the getAllTours
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 2) route handlers/route controllers
// refactor the code to be a bit cleaner
exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// Aggregation pipelines hanndler function
exports.getTourStats = catchAsync(async (req, res, next) => {
  // aggregation pipeline is a mongoDB native feature but mongoose abstract it and give access to us
  // all the documents will go through these stages in the array and final aggregated array will be released
  const stats = await Tour.aggregate([
    {
      // this guy basically selects or filters certain objects based on the query
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // we group the documents using id
        _id: '$difficulty', // group by difficulty
        num: { $sum: 1 }, // add one for each document to find total tours
        numRatings: { $sum: '$ratingsQuantity' }, // total ratings
        averageRating: { $avg: '$ratingsAverage' }, // calculate average based on ratingsAverage for the group
        averagePrice: { $avg: '$price' }, // specify the field we want to find average on with dollar sign in front
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        // we need to use the key names from the previous stage because we're going through this pipeline step by step
        averagePrice: 1, // sort by averagePrice in 1 (ascending order), -1 for descending
      },
    },
    // {
    //     // we can also repeat stages, just FYI
    //     $match: {
    //         // filter again the documents that are not equal to difficulty of easy
    //         _id: { $ne: "easy" } // the _id is now difficulty remember?
    //     }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats, // send the aggregated data
    },
  });
});

// business logic to calculate which month of the year is the busiest
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plans = await Tour.aggregate([
    {
      $unwind: '$startDates', // deconstruct the startDates array, creating a seperate document for each date
    },
    {
      // filter out only the documents fall under the given year range
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // group the data based on the months, show how much tour will start that month and show the tour names
    {
      $group: {
        _id: { $month: `$startDates` },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' }, // add a field called month with the value of id
    },
    {
      $project: {
        // 0 to hide, 1 to show in project
        _id: 0, // hide the _id, so that users can only see which month this is and easy to use
      },
    },
    {
      $sort: { numTourStarts: -1 }, // sort groups by numTourStarts in descending order
    },
    {
      $limit: 12, // limit the documents to show at a time
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plans, // send the aggregated data
    },
  });
});

// exports.getSlug = async (req, res) => {
//     try {
//         const slug = req.params.slug;
//         const slugTour = await Tour.find({ slug: slug});

//         res.status(200).json({
//             status: "success",
//             data: {
//                 slugTour // send the aggregated data
//             }
//         })
//     } catch (err) {
//         res.status(400).json({
//             status: "fail",
//             message: "Invalid data sent."
//         })
//     }
// }
