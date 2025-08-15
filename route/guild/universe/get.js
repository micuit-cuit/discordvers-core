const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'blue', text: 'universe/get' }]);
/* 
    @route: /guild/universe/get
    @name: getUniverse
    @description: Get the full universe of the guild by the discordServerID
    @param: discordServerID
    @return: JSON Object {success, data: universe}
*/
log.s('module Loaded');
module.exports = async function (db, ws, userID, args, requestID) {
    const guildDB = db.models.guild;
    const universeDB = db.models.universe;
    const solarSystemDB = db.models.solarSystem;
    const starDB = db.models.star;
    const planetDB = db.models.planet;
    const moonDB = db.models.moon;
    const disableKeyOnNotAnalyze = {
        star: ['type', 'luminosity', 'temperature', 'habitableZoneStart', 'habitableZoneEnd', ],
        moon: ['resources', ],
        planet: ['resources', 'type', 'gravity', 'density', 'mass', 'pressure', 'temperature', ],
        solarSystem: ['id', 'name', 'universeId', 'posX', 'posY', 'posZ', 'hasAnalyze']
    }
    const alwaysKeyDisable = ['createdAt', 'updatedAt', 'deletedAt']

    const discordServerID = args.discordServerID;
    try {
        //recupération de l'id de l'univers de la guilde
        log.d('getUniverse called with args:', args);
        const guild = await guildDB.findOne({ where: { id: discordServerID } });
        if (!guild) {
            ws.send(JSON.stringify({ success: false, data: 'guild not found', requestID }));
            return;
        }
        log.d('Guild found:', guild.id, guild.name);
        const universeId = guild.universeId;
        if (!universeId) {
            ws.send(JSON.stringify({ success: false, data: 'guild has no universe', requestID }));
            return;
        }
        log.d('Universe ID found:', universeId);
        //recupération de tout les objets de l'univers
        const solarSystems = solarSystemDB.findAll({ where: { universeId } });
        const stars = starDB.findAll({ where: { universeId } });
        const planets = planetDB.findAll({ where: { universeId } });
        const moons = moonDB.findAll({ where: { universeId } });
        const universe = universeDB.findOne({ where: { id: universeId } });
        
        Promise.all([solarSystems, stars, planets, moons, universe]).then((results) => {
            const [solarSystems, stars, planets, moons, universe] = results;
            log.s('Universe retrieved successfully:', universe.id);
            log.s('Solar Systems:', solarSystems.length, 'Stars:', stars.length, 'Planets:', planets.length, 'Moons:', moons.length);
            //construction de l'objet univers { systems: [ { star: { id, name, type, luminosity, temperature, habitableZoneStart, habitableZoneEnd }, planets: [ { id, name, type, gravity, density, mass, pressure, temperature, resources, moons: [ { id, name, resources } ] } ] } ] }
            const universeData = {
                systems: solarSystems.map(solarSystem => {
                    if (!solarSystem.hasAnalyze) {
                        return 
                    }
                    const star = stars.find(s => s.solarSystemId === solarSystem.id);
                    return {
                        star: {
                            ...filterKeys(star.toJSON(), star.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.star, ...alwaysKeyDisable])
                        },
                        planets: planets.filter(planet => planet.solarSystemId === solarSystem.id).map(planet => {
                            return {
                                ...filterKeys(planet.toJSON(), planet.hasAnalyze ? alwaysKeyDisable :  [...disableKeyOnNotAnalyze.planet,...alwaysKeyDisable]),
                                moons: moons.filter(moon => moon.planetId === planet.id).map(moon => {
                                    return {
                                        ...filterKeys(moon.toJSON(), moon.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.moon, ...alwaysKeyDisable])
                                    };
                                })
                            };
                        }),
                        ...filterKeys(solarSystem.toJSON(), solarSystem.hasAnalyze ? alwaysKeyDisable : [...disableKeyOnNotAnalyze.solarSystem, ...alwaysKeyDisable])
                    };
                })
            };
            //remove the null or empty systems
            universeData.systems = universeData.systems.filter(system => system && system.star && system.planets.length > 0);
            log.s('Universe data constructed successfully');

            ws.send(JSON.stringify({ success: true, data: universeData, requestID }));
        }).catch((err) => {
            log.e('Error retrieving universe data:', err);
            ws.send(JSON.stringify({ success: false, data: 'error retrieving universe data', requestID }));
        });
    } catch (err) {
        log.e('Error in getUniverse:', err);
        ws.send(JSON.stringify({ success: false, data: 'error in getUniverse', requestID }));
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