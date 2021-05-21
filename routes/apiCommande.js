'use strict';

var express = require('express');
var routeur = express.Router();
var url_base = "http://localhost:8090";
var jwt = require('jsonwebtoken');

var CommandeModel = require('../modeles/commandeModel').Commande;
// Je suis obligé de l'importer car il faut vérifier que l'objet Json d'un usager dans le body de certaines requêtes soit le même que l'usager avec l'id en query
var UsagerModel = require('../modeles/usagerModel').Usager;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/tp3', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});

/**
 * Permet de vérifier si l'utilisateur est authentifié à l'aide d'un jeton JWT.
 * @param {Object} req Requête HTTP.
 * @param {Function} callback Fonction de callback.
 */
function verifierAuthentification(req, callback) {
    // Récupération du jeton JWT dans l'en-tête HTTP "Authorization".
    var auth = req.headers.authorization;
    if (!auth) {
        // Pas de jeton donc pas connecté.
        callback(false, null);
    } else {
        // Pour le débogage.
        console.log("Authorization : " + auth);
        // Structure de l'en-tête "Authorization" : "Bearer jeton-jwt"
        var authArray = auth.split(' ');
        if (authArray.length !== 2) {
            // Mauvaise structure pour l'en-tête "Authorization".
            callback(false, null);
        } else {
            // Le jeton est après l'espace suivant "Bearer".
            var jetonEndode = authArray[1];
            // Vérification du jeton.
            jwt.verify(jetonEndode, req.app.get('jwt-secret'), function (err, jetonDecode) {
                if (err) {
                    // Jeton invalide.
                    callback(false, null);
                } else {
                    // Jeton valide.
                    callback(true, jetonDecode);
                }
            });
        }
    }
}

// Ajout d'un middleware qui intercepte toutes les requêtes.
routeur.use(function (req, res, next) {
    // Vérification de l'authorisation.
    verifierAuthentification(req, function (estAuthentifie, jetonDecode) {
        if (!estAuthentifie) {
            // Utilisateur NON authentifié.
            res.status(401).json("Le jeton est invalide").end();
        } else {
            // Utilisateur authentifié.
            // Sauvegarde du jeton décodé dans la requête pour usage ultérieur.
            req.jeton = jetonDecode;
            // Pour le déboggage.
            console.log("Jeton : " + JSON.stringify(jetonDecode));
            // Poursuite du traitement de la requête.
            next();
        }
    });
});

routeur.route('/usagers/:usager_id/commandes')
    .post(function (req, res) {
        if  (req.jeton._id !== req.params.usager_id) {
            res.status('401').json("Vous ne pouvez pas accéder à d'autres ressources que les vôtres.").end();
        }
        if (Object.keys(req.body).length !== 0 && req.body.dateArrivee && req.body.usager && req.body.usager.nom && req.body.usager.prenom && req.body.usager.adresse && req.body.usager.pseudo && req.body.usager.motDePasse) {
            UsagerModel.findOne(req.body.usager, function (err, usager) {
                if (usager && usager._id.toString() === req.params.usager_id) {
                    CommandeModel.findOne({dateArrivee: req.body.dateArrivee, 
                        "usager.nom": req.body.usager.nom,
                        "usager.prenom": req.body.usager.prenom,
                        "usager.adresse": req.body.usager.adresse,
                        "usager.pseudo": req.body.usager.pseudo,
                        "usager.motDePasse": req.body.usager.motDePasse
                    }, function (err, commande) {
                        if (!commande) {
                            CommandeModel.create({dateArrivee: req.body.dateArrivee, usager: usager}, function (err, nouvelleCommande) {
                                if (err) throw err;
                                res.status('201').header(
                                    'Location', url_base + '/usagers/' + usager._id + '/commandes/' + nouvelleCommande._id
                                ).json(nouvelleCommande);
                            });
                        } else {
                            res.status('403').json("Une commande existe déjà avec ces mêmes informations");
                        }
                    });
                } else {
                    res.status('403').json("Vous n'avez pas le droit d'ajouter un autre usager que vous à la commande.");    
                }
            });
        } else {
            res.status('400').json("Les champs sont invalides ou vides");
        }
    });

routeur.route('/usagers/:usager_id/commandes/:commande_id')
    .get(function (req, res) {
        if  (req.jeton._id !== req.params.usager_id) {
            res.status('401').json("Vous ne pouvez pas accéder à d'autres ressources que les vôtres.").end();
        }
        CommandeModel.findOne({
            _id: req.params.commande_id
        }, function (err, commande) {
            if (commande) {
                if (commande.usager._id.toString() === req.params.usager_id) {
                    res.status('200').json(commande);
                } else {
                    res.status('401').json("Vous ne pouvez pas accéder à d'autres ressources que les vôtres.");
                }
            } else {
                res.status('404').json("Aucune commande n'a été trouvé avec l'id donné");
            }
        });
    })

    .put(function (req, res) {
        if  (req.jeton._id !== req.params.usager_id) {
            res.status('401').json("Vous ne pouvez pas accéder à d'autres ressources que les vôtres.").end();
        }

        if (Object.keys(req.body).length !== 0 && req.body.dateArrivee && req.body.usager && req.body.usager.nom && req.body.usager.prenom && req.body.usager.adresse && req.body.usager.pseudo && req.body.usager.motDePasse) {
            UsagerModel.findOne(req.body.usager, function (err, usager) {
                // Si on ne trouve pas d'usager, c'est à cause que le contenu de l'usager en body a été modifié
                if (!req.body.plats && !req.body.livreur && usager) {
                    CommandeModel.findOne({_id: req.params.commande_id}, function (err, commande) {
                        if (!commande) {
                            req.body.usager._id = req.jeton._id;
                            req.body._id = req.params.commande_id;
                            CommandeModel.create(req.body, function (err, commandeCree) {
                                res.status('200').json(commandeCree);
                            });
                        } else {
                            if (commande.usager._id.toString() === req.params.usager_id) {
                                commande.dateArrivee = req.body.dateArrivee;
                                commande.save();

                                res.status('201').json(commande);
                            } else {
                                res.status('401').json("Vous ne pouvez pas accéder à d'autres ressources que les vôtres.");
                            }
                        }
                    });
                } else {
                    res.status('403').json("Vous ne pouvez que modifier la date d'arrivée");
                }
            });
        } else {
            res.status('400').json("Les champs sont invalides ou vides");
        }
    })

    .delete(function (req, res) {
        if  (req.jeton._id !== req.params.usager_id) {
            res.status('401').json("Vous ne pouvez pas supprimer une ressource qui ne vous appartient pas").end();
        }
        CommandeModel.findOne({_id: req.params.commande_id}, function (err, commande) {
            if (commande) {
                if (commande.usager._id.toString() === req.params.usager_id) {
                    CommandeModel.deleteOne({_id: req.params.commande_id}, function (err) {
                        res.status('204').send();
                    });
                } else {
                    res.status('401').json("Vous ne pouvez pas supprimer une ressource qui ne vous appartient pas");
                }
            } else {
                res.status('404').json("Aucune commande n'a été trouvé avec l'id donné");
            }
        });
    });

routeur.route('/usagers/:usager_id/commandes/:commande_id/livreur')
    .put(function (req, res) {
        CommandeModel.findOne({_id: req.params.commande_id, "usager._id": req.params.usager_id}, function (err, commande) {
            if (!commande.livreur) {
                res.statusCode = 200;
            } else if (commande.livreur) {
                res.statusCode = 201;
            } else {
                // TODO status code?
                res.send("La commande n'existe pas.");
            }
            commande.livreur = req.body;
            commande.save();
            res.json(commande);
        });
    });


routeur.route('/usagers/:usager_id/commandes/:commande_id/plats')
    .get(function (req, res) {
        CommandeModel.findOne({_id: req.params.commande_id, "usager._id": req.params.usager_id}, function (err, commande) {
            if (err) throw err;
            res.statusCode = 200;
            res.json(commande.plats);
        });
    });

routeur.route('/usagers/:usager_id/commandes/:commande_id/plats/:plat_id')
    .put(function (req, res) {
        CommandeModel.findOne({_id: req.params.commande_id, "usager._id": req.params.usager_id}, function (err, commande) {
            req.body._id = req.params.plat_id;

            if (!commande.plats) {
                commande.plats = [];
            } else {
                for (var i = 0; i < commande.plats.length; i++) {
                    if (commande.plats[i]._id.toString() === req.params.plat_id) {
                        commande.plats[i] = req.body;
                        commande.save();
                        res.status("201").json(commande);
                        return;
                    }
                }
            }
            commande.plats.push(req.body);
            commande.save();
            res.status("200").json(commande);
        });
    })

    .delete(function (req, res) {
        CommandeModel.findOne({_id: req.params.commande_id, "usager._id": req.params.usager_id}, function (err, commande) {
            if (err) throw err;
            req.body._id = req.params.plat_id;

            if (commande.plats) {
                for (var i = 0; i < commande.plats.length; i++) {
                    if (commande.plats[i]._id.toString() === req.params.plat_id) {
                        commande.plats.splice(i, 1);
                        commande.save();
                        res.status("204").send();
                        return;
                    }
                }
            }
            res.send("Votre plat n'a pas été trouvé");
        });
    });

module.exports = routeur;