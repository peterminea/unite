  var express = require('express');
  var router = express.Router();
  const i18next = require('i18next');


  class LanguageController {
     static list(req, res, next) {
      res.render('index', { title: 'Express'});
    }
  }

  module.exports = LanguageController;