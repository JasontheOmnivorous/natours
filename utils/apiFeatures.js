// modular approach for our API features
class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
    // FILTERING
    const queryObj = { ...this.queryString }; // copy the query object to prevent modifying original object
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // fields in the query we want to exclude reading
    excludedFields.forEach(el => delete queryObj[el]); // loop through and delete these guys

    // ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj); // change the query string to string to concat with $ in order to work as mongo query
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // \b guy make sure to match the exact words and g flag make sure to modify all the queries with the name

    this.query = this.query.find(JSON.parse(queryStr));
    return this; // return entire object
    }

    sort() {
        if (this.queryString.sort) {
            // sorting works but what if two or more documents have the same value of our criteria to sort? like same price
            // we should use another category to sort
            // we can do it like sort('price ratingsAverage)
            // but we should use commas for the queries in the actual URL
            // we cant be using spaces, that will lead to confusion
            const sortBy = this.queryString.sort.split(',').join(' '); // split with commas and join with spaces back
            // mongoose will automatically sort the query in ascending order by sort's value
            this.query = this.query.sort(sortBy); // we can sort in descending order by putting minus in front of value in the query
        } else {
            this.query = this.query.sort('-createdAt'); // default set to newest created documents in case user didnt specify sorting
        }
        return this;
    }

    limitFields() {
        // FIELD LIMITING
    if (this.queryString.fields) {
        // we wanna share only the data fields the user asked for to enhance clearity and improve performance
        const fields = this.queryString.fields.split(',').join(' '); // split with commas and rejoin these with spaces
        this.query = this.query.select(fields); // show only the fields the user specified for each document
    } else {
        // mongoose documents have these __v stuffs that mongoose internally uses to function some stuffs
        // it's not a good practice to modify like this
        // in this case, the minus means "don't show it" kind of stuff
        this.query = this.query.select('-__v'); 
    }
    return this;
    }

    paginate() {
    // PAGINATION
    // page=3&limit=10, page1 => 1 to 10, page2 => 11 to 20, page3 => 21 to 30, we start from page3
    // we need to restrict like this because imagine we have a thousand documents, that wouldnt be very nice to send all of them at once
    // that's the main idea of pagination, to give api users ability to decide how much data they wanna be consuming
    // convert query string of page into a number
    const page = this.queryString.page * 1 || 1; // whatever number user put in the query or 1 by default
    const limit = this.queryString.limit * 1 || 100; // user input or 100 documents as limit by default
    const skip = (page - 1) * limit; // calculate numbers of document to skip before querying
    this.query = this.query.skip(skip).limit(limit); // update query string after moodifying 
    return this;
    }
}

module.exports = APIFeatures;