const fs = require('fs');
const path = require('path');

const routeFiles = {};

// Fonction récursive pour parcourir les fichiers et sous-dossiers
function loadFiles(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Si c'est un dossier, on appelle la fonction récursivement
            loadFiles(fullPath);
        } else if (file.endsWith('.js')) {
            // Si c'est un fichier .js, on l'ajoute à routeFiles
            // si il contien index.js on l'iniore
            if (fullPath.includes('index.js')) return;
            const routeKey = path.relative('./route', fullPath);
            routeFiles["/"+routeKey.replace('.js', '')] = require(fullPath.replace('route', './'));
        }
    });
}

// Appel initial pour charger tous les fichiers dans './route'
loadFiles('./route');

module.exports = function (db, ws) {
    ws.on('message', function incoming(message) {
        //decodage du message
        const msg = JSON.parse(message);
        //recuperation du route
        const route = msg.route;
        //recuperation des data
        const data = msg.data;
        //recuperation de l'utilisateur
        const user = msg.user;
        //recuperation de l'id de la requete
        const requestID = msg.requestID;
        //retrouver le fichier de route et l'executer dans file
        const routeFile = routeFiles[route];
        if (!routeFile) {
            ws.send(JSON.stringify({
                status: 404,
                requestID: requestID,
                error: 'route ' + route + ' not found'
            }));
            return;
        }
        routeFile(db, ws, user, data, requestID);
    });
}