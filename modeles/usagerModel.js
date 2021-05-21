'use strict';

var mongoose = require('mongoose');

var usagerSchema = mongoose.Schema({
    nom: String,
    prenom: String,
    adresse: String,
    pseudo: String,
    motDePasse: String
});

module.exports.Usager = mongoose.model('Usager', usagerSchema, 'usagers');
module.exports.Schema = usagerSchema;