// Every object instances created from AppError class inherit the behavior and functionalities of Error class
class AppError extends Error {
    constructor (message, statusCode) {
        // super refers to parent class (Error) and this line is like saying "new Error(message)"
        super (message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // only operational errors will have this property so other stuffs like programming errors will get filtered out
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;