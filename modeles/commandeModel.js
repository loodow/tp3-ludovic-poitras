'use strict';

var mongoose = require('mongoose');
var Livreur = require('./livreurModel');
var Usager = require('./usagerModel');
var Plats = require('./platsModel');

var commandeSchema = mongoose.Schema({
    dateArrivee: Date,
    livreur: Livreur.Schema,
    usager: Usager.Schema,
    plats: [Plats.Schema]
});

module.exports.Commande = mongoose.model('Commande', commandeSchema);