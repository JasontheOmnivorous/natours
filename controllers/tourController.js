const { query } = require('express');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

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
exports.getAllTours = async (req, res) => { 
    try {
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
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
}

exports.getTour = async (req, res) => {
    try {
        // findById method is the another more efficient way to query search with find method and filter object in it
        // Tour.findOne({ _id: req.params.id }) => findById(req.params.id)
        const tour = await Tour.findById(req.params.id);

        res.status(200).json({
            status: "success",
            data: {
                tour
            }
         });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        })
    }
}

exports.createTour = async (req, res) => {
    try {
    // create method saves the data into DB automatically
    const newTour = await Tour.create(req.body); // create new document using our model and request body

    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }
    })
    } catch (err) {
    res.status(400).json({
        status: "fail",
        message: err
    })
    }
}

exports.updateTour = async (req, res) => {
    try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    })
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "Invalid data sent."
        })
    }
}

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        // 204 means no content
        res.status(204).json({
            status: "success",
            data: null
        })
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "Invalid data sent."
        })        
    }
}

// Aggregation pipelines hanndler function
exports.getTourStats = async (req, res) => {
    try {
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
                    // we need to use the key names from the group stage because we're going through this pipeline step by step
                    averagePrice: 1 // sort by averagePrice in 1 (ascending order)
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
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "Invalid data sent."
        })    
    }
}
