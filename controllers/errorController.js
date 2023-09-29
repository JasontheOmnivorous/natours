const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    // handle searching non-existing tour ids
    const message = `Invalid ${err.path}: ${err.value}.`;
    // we basically mark it to be an AppError, so that it can set it to isOperational = true
    return new AppError(message, 400);
}

const sendErrDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrProd = (err, res) => {
    // we wanna show as less-detailed error as possible to the client in production
    if (err.isOperational === true) { // we only wanna send operational errors to the client because they dont need to know programming errors
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    } else {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Oops! Something went wrong.'
        })
    }
}

module.exports = (err, req, res, next) => {
    // console.log(err.stack); 
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err};
        if (error.name === 'CastError') error = handleCastErrorDB(error);

        sendErrProd(error, res);
    }
};