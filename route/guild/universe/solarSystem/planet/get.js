const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'blue', text: 'universe/solarSystem/planet/get' }]);
/* 
    @route: /guild/universe/solarSystem/planet/get
    @name: getUniversePlanet
    @description: Get the planet data of a planetId
    @param: planetID
    @return: JSON Object {success, data: planet}
*/
log.s('module Loaded');
module.exports = async function (db, ws, userID, args, requestID) {
    const planetDB = db.models.planet;
    const moonDB = db.models.moon;
    const disableKeyOnNotAnalyze = {
        star: ['type', 'luminosity', 'temperature', 'habitableZoneStart', 'habitableZoneEnd', ],
        moon: ['resources', ],
        planet: ['resources', 'type', 'gravity', 'density', 'mass', 'pressure', 'temperature', ],
        solarSystem: ['id', 'name', 'universeId', 'posX', 'posY', 'posZ', 'hasAnalyze']
    }
    const alwaysKeyDisable = ['createdAt', 'updatedAt', 'deletedAt']

    const planetID = args.planetID;
    try {
        //recupération de l'id de l'univers de la guilde
        const planet = await planetDB.findOne({ where: { id: planetID } });
        if (!planet) {
            ws.send(JSON.stringify({ success: false, data: 'planet not found', requestID }));
            return;
        }
        const moons = moonDB.findAll({ where: { planetID } });
        
        Promise.all([moons]).then((results) => {
            const [moons] = results;
            log.s('Moons:', moons.length);
            //construction de l'objet univers { systems: [ { star: { id, name, type, luminosity, temperature, habitableZoneStart, habitableZoneEnd }, planets: [ { id, name, type, gravity, density, mass, pressure, temperature, resources, moons: [ { id, name, resources } ] } ] } ] }
            const planetData = {
                ...filterKeys(planet.toJSON(), planet.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.planet, ...alwaysKeyDisable]),
                moons: moons.map(moon => {
                    return {
                        ...filterKeys(moon.toJSON(), moon.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.moon, ...alwaysKeyDisable])
                    };
                })
            };
                
            ws.send(JSON.stringify({ success: true, data: planetData, requestID }));
        }).catch((err) => {
            log.e('Error retrieving planet data:', err);
            ws.send(JSON.stringify({ success: false, data: 'error retrieving planet data', requestID }));
        });
    } catch (err) {
        log.e('Error in getUniversePlanet:', err);
        ws.send(JSON.stringify({ success: false, data: 'error in getUniversePlanet', requestID }));
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