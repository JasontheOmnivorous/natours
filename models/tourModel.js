const mongoose = require('mongoose');

// schema is like a set of rules defined to create our model, which will act as blue print to build our documents
// schema (set of rules) => model (blue print to build a document) => document (actual data structure)
const tourSchema = new mongoose.Schema({
    // This is called schema type options. Now the name data is essential for a document, we can't omit it
    name: {
        type: String,
        // required stuff is called validator, because it is used to validate our data 
        required: [true, "A tour must have a name."], // second element is error message to show up if we omit it
        unique: true, // the name has to be a unique value,
        trim: true // trims the whitespaces in the beginning and ending of summery input
    },
    duration: {
        type: Number,
        required: [true, "A tour must have a duration."]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size."]
    },
    difficulty : {
        type: String,
        required: [true, "A tour should have a difficulty."]
    },
    ratingsAverage: {
        type: Number,
        default: 4.5 // default value to show if we didn't specify the rating
    },
    ratingsQuantity : {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price."]
    },
    priceDiscount: Number,
    summary: {
        type: String,
        trim: true, 
        required: [true, "A tour must have a summary."]
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String, // this will be the name of image which we will read from the file system later
        required: [true, "A tour must have a cover image."]
    },
    images: [String], // other images will be stored as an array of strings
    createdAt: {
        type: Date, // set the datatype of date to check the timestamp of the tour to be created
        // set the default date to now if the user didnt specify the create date
        default: Date.now(), // this returns milliseconds in term of js, but mongo will change this into human readable
        select: false // hide create date
    },
    // different start dates for the same tour
    startDates: [Date]
});

// create the model for the documents using specified schema rules
// the model names should be always started with uppercase
// the model name we gave (the string) become the collection name when we add documents through it
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;