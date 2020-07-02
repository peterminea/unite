const dateformat = require("dateformat");

const basicFormat = (date) => {
  return new Date(date).toISOString().replace(/T/, ' '). replace(/\..+/, '');
};

const customFormat = (date) => {
  return dateformat(date, "dddd, mmmm dS, yyyy, h:MM:ss TT");
}

const normalFormat = (date) => {
  return dateformat(date, "dddd, mmmm dS, yyyy");
}

module.exports = { basicFormat, customFormat, normalFormat };