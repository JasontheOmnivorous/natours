const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

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

// Handling non-existing routes
/*
Middlewares act like a pipeline so if the code execution reach to this line of code, 
that means it's not handled by other route middlewares placed above.
*/
// route path for all http verbs
// * for all routes that are not handled
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Cannot find URL: ${req.originalUrl} on this server.` // message to remind user that the server can't find the Url user used
    // });

    // Error passing demo
    // const err = new Error(`Cannot find URL: ${req.originalUrl} on this server.`);
    // err.statusCode = 404;
    // err.status = 'fail';

    // whatever we pass inside next function's param, Express will automatically assume it's an error and pass it directly to global error handling middleware
    next(new AppError(`Cannot find URL: ${req.originalUrl} on this server.`, 404));
});

// Global error handling middleware
// err param has to be at the first place to inform Express this is global error handling middleware
app.use(globalErrorHandler);

// server
module.exports = app;