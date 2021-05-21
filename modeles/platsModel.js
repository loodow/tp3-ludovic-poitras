'use strict';

var mongoose = require('mongoose');

var platsSchema = mongoose.Schema({
    nom: String,
    nbrPortions: Number
});

module.exports.Plats = mongoose.model('Plats', platsSchema);
module.exports.Schema = platsSchema;