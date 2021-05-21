'use strict';

var express = require('express');
var routeur = express.Router();
var url_base = "http://localhost:8090";

var PlatsModel = require('../modeles/platsModel').Plats;
var cors = require('cors');

// routeur.use(cors());

var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.rc1ua.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/tp3', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});

// TODO CORS, à finir

var whitelist = ['https://www.delirescalade.com', 'https://www.chess.com', 'https://cegepgarneau.omnivox.ca'];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

routeur.get('/plats', cors(corsOptions), function (req, res) {
    PlatsModel.find({}, function (err, plats) {
        if (err) throw err;

        var resBody = [];
        plats.forEach(plat => {
            var liens = [{
                    rel: "self",
                    method: "GET",
                    href: "http://localhost:8090/plats/" + plat._id.toString()
                },
                {
                    rel: "delete",
                    method: "DELETE",
                    href: "http://localhost:8090/plats/" + plat._id.toString()
                }
            ];
            
            var platJson = plat.toJSON();
            platJson.liens = liens;
            resBody.push(platJson);
        });
        res.status(200).json(resBody);
    });
});

routeur.post('/plats', function (req, res) {
    if (Object.keys(req.body).length !== 0 && req.body.nom && req.body.nbrPortions) {
        PlatsModel.findOne(req.body, function (err, plat) {
            if (!plat) {
                PlatsModel.create(req.body, function (err, plat) {
                    res.header('Location', url_base + '/plats/' + plat._id).status(201).json(plat, [{
                            rel: "self",
                            method: "GET",
                            href: "http://localhost:8090/plats/" + plat._id.toString()
                        },
                        {
                            rel: "delete",
                            method: "DELETE",
                            href: "http://localhost:8090/plats/" + plat._id.toString()
                        }
                    ]);
                });
            } else {
                res.status('403').json("Un plat existe déjà avec ces mêmes informations");
            }
        });
    } else {
        res.status('400').json("Les champs sont invalides ou vides");
    }
});

routeur.route('/allo', cors(corsOptions), function (req, res) {
    res.send("allo");
});

routeur.route('/plats/:plat_id', cors(corsOptions))
    .get(function (req, res) {
        PlatsModel.findOne({
            _id: req.params.plat_id
        }, function (err, plat) {
            if (plat) {
                res.status('200').json(plat, [{
                        rel: "self",
                        method: "GET",
                        href: "http://localhost:8090/plats/" + req.params.plat_id
                    },
                    {
                        rel: "delete",
                        method: "DELETE",
                        href: "http://localhost:8090/plats/" + req.params.plat_id
                    }
                ]);
            } else {
                res.status('404').json("L'id ne correspond à aucun plat");
            }
        });
    })

    .delete(function (req, res) {
        PlatsModel.findOne({_id: req.params.plat_id}, function (err, plat) {
            if (plat) {
                PlatsModel.deleteOne({
                    _id: req.params.plat_id
                }, function (err) {
                    res.status('204').send();
                });
            } else {
                res.status('404').json("Aucun plat n'a été trouvé avec l'id donné");
            }
        });
        
    });



module.exports = routeur;