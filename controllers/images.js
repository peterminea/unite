'use strict';

const Image = require('../models/image');

exports.index = (req, res) => {
  Image.find({logEntryId: req.params.logEntryId}, function(err, image) {
    if(err) res.send(err);
    res.json(image);
  });
}

exports.show = (req, res) => {
  Image.findById(id, function(err, image) {
    if(err) res.send(err);
    res.json(image);
  });
}

exports.create = (req, res) => {
  const path = require('path');
  const remove = path.join(__dirname, '..', '..', 'public');
  const relPath = req.file.path.replace(remove, '');
  const newImage = new Image(req.body);
  newImage.logEntryId = req.params.logEntryId;
  newImage.path = relPath;
  newImage.save(function(err, image) {
    if(err) res.send(err);
    res.json(image);
  });  
}

exports.update = (req, res) => {
  
};

exports.destroy = (req, res) => {
  Image.deleteOne({_id: req.params.id}, function(err, image) {
    if(err) res.send(err);
    res.json({message: 'Image (${req.params.id}) was successfully deleted.'});
  });
}