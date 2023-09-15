const mongoose = require('mongoose');
// we need dotenv package to connect configured env variables inside .env file and our server
const dotenv = require('dotenv');
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
    useFindAndModify: false
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
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


