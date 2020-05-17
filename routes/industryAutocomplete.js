const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const Industry = require("../models/industry");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/industryAutocomplete", function(req, res) {
  var regex = new RegExp(req.query["term"], 'i');
  var industryFilter = Industry.find({name: regex}, {'name': 1}).sort({"name":-1}).limit(5);
  
  industryFilter.exec(function(err, data) {
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
    }
  });
});

module.exports = router;