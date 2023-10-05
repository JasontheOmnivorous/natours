const mongoose = require('mongoose');
// we need dotenv package to connect configured env variables inside .env file and our server
const dotenv = require('dotenv');

// handling uncaught exceptions in synchronous code
// this event handler works the same with handling unhandledRejections
// we need this guy to be placed before every other code (especially, before requiring app) 
process.on('uncaughtException', err => {
    console.log('Uncaught Exception!! Shutting down the application...');
    console.log(err.name, err.message);
    process.exit(1);
});

// requiring the dotenv and configuring the path should be written one after another to avoid uneccasary bugs
dotenv.config({ path: './config.env' }); // read our variables inside config.env and save them into Node.js env variables

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); // replace the placeholder with actual pw for DB
// option object is passed to confiure the connection with DB
mongoose.connect(DB, {
    // This option is used to parse the connection string using the new URL parser. It's recommended to include this option for better compatibility with future MongoDB driver updates.
    useNewUrlParser: true, 
    // You dont need to know specifically about these guys. Just use them in your projects, don't ask:)
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}) // this connect method actually returns a promise
.then(connection => {
    // console.log(connection.connections); // you can extract some database info from its connections object
    console.log('DB connection successful');
});

// // connecting with local DB
// mongoose.connect(process.env.DATABASE_LOCAL, {
//     useNewUrlParser: true, 
//     useCreateIndex: true,
//     useFindAndModify: false
// }).then(() => console.log('Local DB connection successful'));

// console.log(process.env); // we can see our env variables like this
const port = process.env.PORT || 3000; // we either use our env variable for port or 3000
// it's a good practice to seperate everything related to express and everything related to the server
// automatically create a server and listen
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// event handler for unhanledRejection (unhandled promises)
// each time theres is an unhandled rejection somewhere in application, the process object emits an object called unhandledRejection
process.on('unhandledRejection', err => {
    console.log('Undandled Rejection!! Shutting down the application...');
    console.log(err.name, err.message);
    // shut down out application if there's an unhandled rejection
    // close the server first to give the server time to finish all the pending request and responses
    // only after that, the app will crash
    server.close(() => {
        process.exit(1); // code 0 stands for success and 1 stands for uncaught exception inside exit method
    })
});