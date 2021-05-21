'use strict';

var express = require('express');
var routeur = express.Router();
var url_base = "http://localhost:8090";
var jwt = require('jsonwebtoken');

var LivreurModel = require('../modeles/livreurModel').Livreur;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/tp3', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});

routeur.route('/livreurs')
    .post(function (req, res) {
        if (Object.keys(req.body).length !== 0 && req.body.nom && req.body.prenom && req.body.voiture && req.body.quartier) {
            LivreurModel.findOne(req.body, function (err, livreur) {
                if (!livreur) {
                    LivreurModel.create(req.body, function (err, livreur) {
                        if (err) throw err;
                        res.header('Location', url_base + '/livreurs/' + livreur._id).status('201').json(livreur);
                    });
                } else {
                    res.status('403').json("Un livreur existe déjà avec ces mêmes informations");
                }
            });
        } else {
            res.status('400').json("Les champs sont invalides ou vides");
        }
    });

routeur.route('/livreurs/:livreur_id')
    .get(function (req, res) {
        LivreurModel.findOne({_id: req.params.livreur_id}, function (err, livreur) {
            if (livreur) {
                res.status('200').json(livreur);
            } else {
                res.status('404').json("Aucun usager n'a été trouvé avec l'id donné");
            }
        });
    })

    .delete(function (req, res) {
        LivreurModel.findById({_id: req.params.livreur_id}, function (err, livreur) {
            if (livreur) {
                LivreurModel.deleteOne(livreur, function (err) {
                    res.status('204').send();
                });
            } else {
                res.status('404').json("Aucun livreur n'a été trouvé avec l'id donné");
            }
        }); 
    });

module.exports = routeur;