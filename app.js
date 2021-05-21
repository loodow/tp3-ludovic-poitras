'use strict';
var express = require('express');
var app = express();
//Permet de récupérer du JSON dans le corps de la requête
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var hateoasLinker = require('express-hateoas-links');
app.use(hateoasLinker);
// SWAGGER
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

//importe notre routeur du fichier base.js
var routeurApiUsager = require('./routes/apiUsager');
var routeurApiLivreur = require('./routes/apiLivreur');
var routeurApiPlats = require('./routes/apiPlats');
var routeurApiCommande = require('./routes/apiCommande');

var config = require('./config');
app.set('jwt-secret', config.secret);

//indique à notre app d'utiliser le routeur pour toutes les requêtes à partir de la racine du site web
app.use('/', routeurApiUsager);
app.use('/', routeurApiLivreur);
app.use('/', routeurApiPlats);
app.use('/', routeurApiCommande);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Gestion de l'erreur 404.
app.all('*', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).send('Erreur 404 : Ressource inexistante !');
});

// Démarrage du serveur.
app.listen(8090, function () {
    console.log('Serveur sur port ' + this.address().port);
});