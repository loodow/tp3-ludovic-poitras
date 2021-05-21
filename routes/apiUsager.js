'use strict';

var express = require('express');
var routeur = express.Router();
var url_base = "http://localhost:8090";
var jwt = require('jsonwebtoken');

var UsagerModel = require('../modeles/usagerModel').Usager;

var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.rc1ua.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/tp3', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});

routeur.route('/usagers')
    .post(function (req, res) {
        // Vérifie que le body n'est pas vide
        // TODO voir comment changer le header
        
        if (Object.keys(req.body).length !== 0 && req.body.nom && req.body.prenom && req.body.adresse && req.body.pseudo && req.body.motDePasse) {
            UsagerModel.findOne(req.body, function (err, usager) {
                if (!usager) {
                    UsagerModel.create(req.body, function (err, usager) {
                        if (err) throw err;
                        res.header('Location', url_base + '/usagers/' + usager._id).status('201').json(usager);
                    });
                } else {
                    res.status('403').json("Un usager existe déjà avec ces mêmes informations");
                }
            });
        } else {
            res.status('400').json("Les champs sont invalides ou vides");
        }
    });

routeur.route('/usagers/:usager_id')
    .get(function (req, res) {
        UsagerModel.findOne({
            _id: req.params.usager_id
        }, function (err, usager) {
            if (usager) {
                res.status('200').json(usager);
            } else {
                res.status('404').json("L'id ne correspond à aucun usager");
            }
        });
    })

    // Seulement pour rétablir la base de données dans les tests
    .delete(function (req, res) {
        UsagerModel.deleteOne({_id: req.params.usager_id}, function (err) {
            res.status('204').json("L'usager a été supprimé");
        });
    });

routeur.route('/connexions')
    .post(function (req, res) {
        if (Object.keys(req.body).length !== 0 && req.body.nom && req.body.prenom && req.body.adresse && req.body.pseudo && req.body.motDePasse) {
            UsagerModel.findOne(req.body, function (err, usager) {
                if (err) throw err;
                else if (usager) {
                    console.log(usager._id);
                    var jeton = jwt.sign(usager.toObject(), req.app.get('jwt-secret'), {
                        expiresIn: 86400
                    });
                    res.status('201').json(jeton);
                }
            });
        } else {
            res.status('400').json("Les champs sont invalides ou vides");
        }
    });

module.exports = routeur;