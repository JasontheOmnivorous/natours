exports.filterObj = (obj, ...allowedFields) => {
  const finalObj = {};

  // Iterate through each key in the request body object (obj)
  // If the current key exists in the allowedFields parameter array,
  // add that key-value pair to the final object
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      finalObj[item] = obj[item];
    }
  });

  return finalObj; // return final filtered object
};
