const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }]);
const micuitDb = require('micuit-db');
const http = require('http');
const ws = require('ws');
const route = require('./route');
const dotEnv = require('dotenv');
dotEnv.config(); // Chargement des variables d'environnement
// require('./lib/universeGenerator.js'); // Importation du générateur d'univers

const port = process.env.PORT || 8080;
log.i('syncing db');
micuitDb.sync().then(() => {
    log.s('db synced');
    //demarrage du serveur ws
    const wss = new ws.Server({ noServer: true });
    wss.on('connection', function connection(ws) {
        log.d('connected');
        //transmission des messages vers le routeur
        route(micuitDb, ws);
        ws.on('close', function close() {
            log.d('disconnected');
        });
        ws.on('error', function error(err) {
            log.e('error:', err);
        });
    });
    wss.on('error', function error(err) {
        log.e('error:', err);
    });
    log.i('ws server started');
    //demarrage du serveur websocket
    const server = http.createServer();
    server.on('upgrade', function upgrade(request, socket, head) {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    });
    server.listen(port, () => {
        log.i('server started on port:', port);
    })

}).catch((err) => {
    log.e('error syncing db:', err);
});


process.on('unhandledRejection', (reason, promise) => {
	console.error('⚠️ Rejet de promesse non géré:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('⚠️ Exception non capturée:', err);
});