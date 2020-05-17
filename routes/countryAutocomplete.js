const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const Country = require("../models/country");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/countryAutocomplete", function(req, res) {//Not displaying the message
  console.log('The test log.debug');
  var regex = new RegExp(req.query["term"], 'i');
  var countryFilter = Country.find({name: regex}, {'name': 1}).sort({"name":-1}).limit(5);
  
  countryFilter.exec(function(err, data) {
    var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item=>{
          let obj = {
            id: item._id,
            name: item.name
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);
      //res.send(result, {
        //    'Content-Type': 'application/json'
         //}, 200);
    }
  });
});

module.exports = router;