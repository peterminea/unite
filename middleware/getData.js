const getObjectMongo = async (db, table, obj, field) => {
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      db
      .collection(table)
      .findOne((typeof obj !== 'undefined' && obj instanceof Object)? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}, function(err, data) {
         err 
            ? reject(err) 
            : resolve(data);
       });
     });
  };

  let result = await myPromise();
  return result;
};


const getObjectMongoose = async (model, obj, field) => {
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      eval(`let ${model} = require('../models/${lowerCase(model)}'); ${model}.findOne((typeof obj !== 'undefined' && obj instanceof Object)? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}, (err, data) => { err? reject(err) : resolve(data); });`);
    });
  };

  let result = await myPromise();
  return result;
};


const getDataMongo = async(db, table, obj, field) => {//DB connection active.
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      db
      .collection(table)
      .find(typeof obj !== 'undefined' && obj instanceof Object? obj : {},
           typeof field !== 'undefined' && field instanceof Object? field : {})
      .toArray(function(err, data) {
         err 
            ? reject(err) 
            : resolve(data);
       });
     });
  };

  let result = await myPromise();
  return result;
}


//function lowerCase
function lowerCase(s) {
  return s.replace(/^.{1}/g, s[0].toLowerCase());
}


const getDataMongoose = async (model, obj, field) => {//A Mongoose model name.
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      eval(`let ${model} = require('../models/${lowerCase(model)}'); ${model}.find(typeof obj !== 'undefined' && obj instanceof Object? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}).then((data, err) => { err || !data? reject(err) : resolve(data); });`);      
    });
  };

  let result = await myPromise();
  return result;
}


module.exports = { getObjectMongo, getDataMongo, getObjectMongoose, getDataMongoose };