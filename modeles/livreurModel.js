'use strict';

var mongoose = require('mongoose');

var livreurSchema = mongoose.Schema({
    nom: String,
    prenom: String,
    voiture: String,
    quartier: String
});

module.exports.Livreur = mongoose.model('Livreur', livreurSchema);
module.exports.Schema = livreurSchema;