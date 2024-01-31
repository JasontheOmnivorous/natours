/*
fat models, thin controllers => Offload as much business logic as possible to models and use as little business logic
as possible in controllers, because we want to seperate application logic and business logic as much as we can.
*/

const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

// schema is like a set of rules defined to create our model, which will act as blue print to build our documents
// schema (set of rules) => model (blue print to build a document) => document (actual data structure)
const tourSchema = new mongoose.Schema(
  {
    // This is called schema type options. Now the name data is essential for a document, we can't omit it
    name: {
      type: String,
      // required stuff is called validator, because it is used to validate our data
      required: [true, 'A tour must have a name.'], // second element is error message to show up if we omit it
      unique: true, // the name has to be a unique value,
      trim: true, // trims the whitespaces in the beginning and ending of summery input
      // data validation
      maxlength: [
        40,
        'Tour name must be shorter than or equal to 40 characters.',
      ],
      minlength: [
        10,
        'Tour name must be longer than or equal to 10 characters.',
      ],
      // this dude doesnt even allow spaces for the name so i'll leave it here just for demo of validator library
      // validate: [isAlpha, 'Tour name must only contains alphabets.'] // method that validates if the input data are alphabets or not
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size that can fit.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour should have a difficulty.'],
      // validator for difficulty
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty has to be either easy, medium or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // default value to show if we didn't specify the rating
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      // custom validator
      validate: {
        validator: function (val) {
          // return bool if the value we give as priceDiscount is less than actual price or not
          // important to note that in this case, "this" keyword only refers to the created object, which means this validation is not gonna work for updating
          return val < this.price; // of course it's gonna show error if the return value is false
        },
        message: 'Discount price ({VALUE}) must be less than regular price.', // ({VALUE}) is the placeholder for actual input discounr val
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // this will be the name of image which we will read from the file system later
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String], // other images will be stored as an array of strings
    createdAt: {
      type: Date, // set the datatype of date to check the timestamp of the tour to be created
      // set the default date to now if the user didnt specify the create date
      default: Date.now(), // this returns milliseconds in term of js, but mongo will change this into human readable
      select: false, // hide create date
    },
    // different start dates for the same tour
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // In GeoJSON, the geospatial data structure is represented as an object.
      // we need to use type as an object because it simply cant be plain String or Number,
      // it's a geospatial data and it's type should be Point
      // that's why we need to nest another type inside
      // so, what make an object GeoJSON in the schema are type and coordinate fields
      type: {
        type: String,
        // we can specify multiple geometries like polygons, lines in MongoDB
        // the default one is always Point
        default: 'Point',
        // but in this case, startLocation should be Point, so let's strict it with enum
        enum: ['Point'],
      },
      // this is an array of numbers representing the coordinates of the point
      // The order of the numbers depends on the coordinate reference system used (typically [longitude, latitude])
      coordinates: [Number],
      address: String,
      description: String,
    },
    // embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      // make a reference to the relevant document of the entity we referred as ref
      // so this is only a reference in the database, but if we want to see
      // the referenced data as embedded, we just need to add .popluate('guides') in the query
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // establish entity reference
      },
    ],
  },
  {
    // schema option to show virtual properties when the model is in the form of JSON or object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// virtual properties
// we can use various calculations for the schema using virtual properties
// NOTE: we can't use virtual properties in querying, because technically, they're not real fields in the document
// They are only used for the user experience
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // calculate duration in weeks
});

// MongoDB Document middleware that runs before .save() and .create()
// pre save hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // slugify and shows the document's name
  console.log(this.slug);
  next();
});

// Embedding approach for tour guides in each tour
// we're just gonna use user ids as tour guides to create each tour
// so basically what we're doing here is, finding the real user data
// and use it in the place of user ids we put in
// tourSchema.pre('save', async function (next) {
//   // map will push each element to a new array and we made it's callback an async
//   // so, new array is an aray full of promises
//   const guidePromises = this.guides.map(
//     async (userId) => await User.findById(userId),
//   );
//   this.guides = await Promise.all(guidePromises); // resolve promises and assign it to guides array

//   next();
// });

// // demo of document middleware pipeline
// tourSchema.pre('save', function(next) {
//     console.log('will save document');
//     next();
// });

// // post save hook
// // this guy get access to previously saved document and next function
// // this will run only after all the pre hooks are done running
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

// MongoDB Query Middlware
// pre find hook
// use pre find hook to not show secret tours before saving to the DB
// use regex to make sure the middleware is working for both find and findOne queries
// ^find literally means all the queries start with find
tourSchema.pre(/^find/, function (next) {
  // in query middleware, 'this' always points to the current query
  this.find({ secretTour: { $ne: true } }); // only shows non-secret tours
  this.start = Date.now();
  next();
});

// populate guide references to all the queries starting with find
tourSchema.pre(/^find/, function (next) {
  // populate method populates the referenced ids in the db with actual data they're referencing
  // one thing to keep in mind is that behind the scenes, using populate will make an additional query
  // to the database, so it might effect your app's performance
  this.populate({
    path: 'guides', // the field we want to populate
    select: '-__v', // specify to not show the __v field in referenced user document
  });

  next();
});

// MongoDB Aggregation Middleware
tourSchema.pre('aggregate', function (next) {
  // add another match to  filter out aggregated object pipeline method's secret tours
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// post find hook gets access to all the documents after the query has executed
tourSchema.post(/^find/, function (docs, next) {
  // calculate how long it takes to execute current query
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

// create the model for the documents using specified schema rules
// the model names should be always started with uppercase
// the model name we gave (the string) become the collection name when we add documents through it
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
