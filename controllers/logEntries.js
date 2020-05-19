'use strict';

const LogEntry = require('../models/logEntry');

exports.index = (req, res) => {
  LogEntry.find({})
    .populate('images')
    .exec(function(err, logEntry) {
      if(err) res.send(err);
      res.json(logEntry);    
  });
}

exports.create = (req, res) => {
  const newLogEntry = new LogEntry(req.body);
  newLogEntry.save(function(err, logEntry) {
    if(err) res.send(err);
    res.json(logEntry); 
  });
}

exports.show = (req, res) => {
  LogEntry.findById(req.params.id)
    .populate('images')
    .exec(function(err, logEntry) {
      if(err) res.send(err);
      res.json(logEntry); 
  });
}

exports.update = (req, res) => {
  LogEntry.findOneAndUpdate({_id: req.params.id}, function(err, logEntry) {
    if(err) res.send(err);
    res.json(logEntry);
  })
}

exports.destroy = (req, res) => {
  LogEntry.deleteOne({_id: req.params.id}, function(err, logEntry) {
    if(err) res.send(err);
    res.json({message: 'LogEntry (${req.params.id}) was successfully deleted.'});
  });
}