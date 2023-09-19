const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: './config.env' }); 

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); 

mongoose.connect(DB, {
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify: false
})
.then(connection => {
    console.log('DB connection successful');
});

// READ JSON FILE
// this is read as a string so we need to parse this guy up into JS array of objects
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')); 

// IMPORT DATA INTO DATABASE
const importData = async () => {
    try {
        await Tour.create(tours); // simply create and save the JSON into DB using mongoose
        console.log('Data successfully loaded!');
    } catch (err) {
        console.log(err);
    }
    process.exit(); // exit the node environment after executing this function
}

// DELETE ALL DATA FROM DATABASE
const deleteData = async () => {
    try {
        // deleteMany method will delete everything in the database if we didnt pass any argument to it
        await Tour.deleteMany(); 
        console.log('Data successfully deleted!');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}


// catch flags from terminal and control the import/delete flow
if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

// // this guy log out the command line arguments in a form of array of strings
// // the array contains the directories of the arguments in string form, including node.js's itself
// console.log(process.argv);