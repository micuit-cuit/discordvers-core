const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'blue', text: 'universe/solarSystem/planet/moon/get' }]);
/* 
    @route: /guild/universe/solarSystem/planet/moon/get
    @name: getUniverseMoon
    @description: Get the data of a moon by its moonID
    @param: moonID
    @return: JSON Object {success, data: moon}
*/
log.s('module Loaded');
module.exports = async function (db, ws, userID, args, requestID) {
    const moonDB = db.models.moon;
    const disableKeyOnNotAnalyze = {
        star: ['type', 'luminosity', 'temperature', 'habitableZoneStart', 'habitableZoneEnd', ],
        moon: ['resources', ],
        planet: ['resources', 'type', 'gravity', 'density', 'mass', 'pressure', 'temperature', ],
        solarSystem: ['id', 'name', 'universeId', 'posX', 'posY', 'posZ', 'hasAnalyze']
    }
    const alwaysKeyDisable = ['createdAt', 'updatedAt', 'deletedAt']

    const moonID = args.moonID;
    try {
        //recupération de l'id de l'univers de la guilde
        log.d('getUniverseMoon called with args:', args);
        const moon = await moonDB.findOne({ where: { id: moonID } });
        if (!moon) {
            ws.send(JSON.stringify({ success: false, data: 'moon not found', requestID }));
            return;
        }

        
        const moonData = {
                ...filterKeys(moon.toJSON(), moon.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.moon, ...alwaysKeyDisable])
            };

            
        ws.send(JSON.stringify({ success: true, data: moonData, requestID }));
    } catch (err) {
        log.e('Error in getUniverseMoon:', err);
        ws.send(JSON.stringify({ success: false, data: 'error in getUniverseMoon', requestID }));
    }
}
function filterKeys(obj, keysToFilter) {
    return fixedKeys(Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToFilter.includes(key))));
}
const fixedKeysData = {
    'color': numberToHex,
    'gravity': 1000,
    'density': 1000,
    'mass': integerToSci,
    'pressure': 1000
}
function fixedKeys(obj) {
    // parcoure tous les objets et remplace les valeurs des clés par la conversion de la valeur
    for (const key in obj) {
        if (fixedKeysData[key]) {
            if (typeof fixedKeysData[key] === 'function') {
                obj[key] = fixedKeysData[key](obj[key]);
            } else {
                obj[key] = obj[key] / fixedKeysData[key];
            }
        }
        // si la valeur est un objet, on l'appelle récursivement
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = fixedKeys(obj[key]);
        }
    }
    return obj;
}

function numberToHex(number) {
    return '#' + number.toString(16).padStart(6, '0');
}
function integerToSci(value) {
    if (value === 0) return '0';
    value = value.toString();
    const base = value.slice(-5);
    const exponent = value.slice(0, -6);
    return base/1000 *10**exponent
}