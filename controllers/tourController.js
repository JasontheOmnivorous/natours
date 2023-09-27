const { query } = require('express');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
    // manipulate the query object in the middleware, so that it's already different when it reaches the getAllTours
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
} 

// // parse the raw JSON file which is a string after reading, into a JS array with objects
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// // instead of checking if the id is valid or not again and again, we just use a middleware at the start
// // val is the value of id we put in the request URL param
// exports.checkId = (req, res, next, val) => {
//     if (req.params.id * 1 > tours.length) return res.status(404).json({
//         status: "failed",
//         message: "Invalid id"
//     });
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         // this return in the middlware is extremely important and if we didnt add that, other middlwares will keep running
//         return res.status(400).send({
//             status: "failed",
//             message: "Missing name or price"
//         })
//     } 
//     next();
// }

// 2) route handlers/route controllers
// refactor the code to be a bit cleaner
exports.getAllTours = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(); // chain the methods, in other words, apply all the features to the model
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: "success",
        requestedAt: req.requestTime, // use the data pass through middleware stack or pipeline
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
        // findById method is the another more efficient way to query search with find method and filter object in it
        // Tour.findOne({ _id: req.params.id }) => findById(req.params.id)
        const tour = await Tour.findById(req.params.id);

        res.status(200).json({
            status: "success",
            data: {
                tour
            }
         });
});

exports.createTour = catchAsync(async (req, res, next) => {
    // create method saves the data into DB automatically
    const newTour = await Tour.create(req.body); // create new document using our model and request body

    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }
    })
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // run validators
    });
    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    })
});

exports.deleteTour = catchAsync(async (req, res, next) => {
        await Tour.findByIdAndDelete(req.params.id);
        // 204 means no content
        res.status(204).json({
            status: "success",
            data: null
        })
});

// Aggregation pipelines hanndler function
exports.getTourStats = catchAsync(async (req, res, next) => {
        // aggregation pipeline is a mongoDB native feature but mongoose abstract it and give access to us
        // all the documents will go through these stages in the array and final aggregated array will be released
        const stats = await Tour.aggregate([
            {
                // this guy basically selects or filters certain objects based on the query
                $match: { ratingsAverage: { $gte: 4.5 } } 
            },
            {
                $group: {
                    // we group the documents using id
                    _id: "$difficulty", // group by difficulty
                    num: { $sum: 1 }, // add one for each document to find total tours
                    numRatings: { $sum: "$ratingsQuantity" }, // total ratings
                    averageRating: { $avg: "$ratingsAverage" }, // calculate average based on ratingsAverage for the group
                    averagePrice: { $avg: "$price" }, // specify the field we want to find average on with dollar sign in front
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" }
                }
            },
            {
                $sort: {
                    // we need to use the key names from the previous stage because we're going through this pipeline step by step
                    averagePrice: 1 // sort by averagePrice in 1 (ascending order), -1 for descending
                }
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
            status: "success",
            data: {
                stats // send the aggregated data
            }
        })
});

// business logic to calculate which month of the year is the busiest
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year * 1;
        const plans = await Tour.aggregate([
            {
                $unwind: '$startDates' // deconstruct the startDates array, creating a seperate document for each date
            },
            {
                // filter out only the documents fall under the given year range
                $match: {
                    startDates: { 
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                     }
                }
            },
            // group the data based on the months, show how much tour will start that month and show the tour names
            {
                $group: {
                    _id: { $month: `$startDates` },
                    numTourStarts: { $sum: 1 },
                    tours: { $push: '$name' }
                }
            },
            {
                $addFields: { month: '$_id' } // add a field called month with the value of id
            },
            {
                $project: {
                    // 0 to hide, 1 to show in project
                    _id: 0 // hide the _id, so that users can only see which month this is and easy to use
                }
            },
            {
                $sort: { numTourStarts: -1 } // sort groups by numTourStarts in descending order
            },
            {
                $limit: 12 // limit the documents to show at a time
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                plans // send the aggregated data
            }
        })
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