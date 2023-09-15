const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express(); // activate express

// 1) middlewares
// morgan third-party middleware provide request method, path, request time, etc.. to ease out developer life
// only log the morgan stuffs when our enviornment is development
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// this guy is what the request goes through while it's processing
app.use(express.json()); // this middleware is responsible for parsing the data from the req object into JSON

// serve static files with a middlware 
// for example we want to search overview file from public folders, we dont need to search like 127.0.0.1:3000/public/overview.html
// express actually map through the project and find the file you searched by providing the directory with express.static()
// this guy only works for static files because obviously, it's name is static
app.use(express.static(`${__dirname}/public`));

// The middlewares work like a pipeline in express. We can also chain these guys using next function
app.use((req, res, next) => {
    console.log('Hello from the middleware');
    // calling next function is extremely important, because if we didn't call it, req res cycle will be stuck here
    next();
});

app.use((req, res, next) => {
    // this guy is passed through the next function to the following middleware or route handler
    req.requestTime = new Date().toISOString(); // change the request time to readable current time
    next();
})

// Routes
// all requests matching this mount router's path will be handled by the routes defined with it's name
// we can also think of it like parent and children routes
// so basically, it's like route mounts with same main URL => routes with different http verbs => route controllers
// route mounts used as middlewares
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// server
module.exports = app;