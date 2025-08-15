const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'blue', text: 'creatGuild' }]);
const guildRole = require('../../lib/guildRole');
const {generateRandomUniverse} = require('../../lib/universeGenerator.js');
const snowflake = require('../../lib/snowflake.js');
/* 
    @route: /guild/creat
    @name: creatGuild
    @description: Create a new guild in the database and add the user as owner
    @param: discordServerID, guildName, userID
    @return: JSON Object {success, data: guild}
*/
log.s('module Loaded');
module.exports = async function (db, ws, userID, args, requestID) {
    //check si l'utilisateur existe
    const userDB = db.models.user;
    const guildDB = db.models.guild;
    const discordServerID = args.discordServerID;
    const guildName = args.guildName;
    const universeId = snowflake('universe').str;
    try {
        log.d('createGuildProcess called with args:', args);
		const user = await userDB.findOne({ where: { id: userID } });
		if (!user) {
			ws.send(JSON.stringify({ success: false, data: 'user not found', requestID }));
			return;
		}
        log.d('User found:', user.id, user.username);

		const guild = await guildDB.findOne({ where: { id: discordServerID } });
		if (guild) {
			ws.send(JSON.stringify({ success: false, data: 'guild already exist', requestID }));
			return;
		}
        log.d('Guild not found, creating new guild:', discordServerID, guildName);



		const universe = generateRandomUniverse().toJSON();
		log.s('Generated Universe:', universe);
        const universeDB = db.models.universe;
        const solarSystemDB = db.models.solarSystem;
        const starDB = db.models.star;
        const planetDB = db.models.planet;
        const moonDB = db.models.moon;
		await universeDB.create({ id: universeId });

        const solarSystemPush = [],
              starPush = [],
              planetPush = [],
              moonPush = []
        let homePlanetId = null;
        for (const solarsystem of universe.systems) {
            const star = solarsystem.star;
            const solarsystemId = snowflake('universeSolarSystem').str;
            const starId = star.id;
            solarSystemPush.push({
                    id: solarsystemId,
                    universeId: universeId,
                    name: "solarsystem.name",
                    posX: 0,
                    posY: 0,
                    posZ: 0}
                );
            starPush.push({
                    id: starId,
                    name: star.name,
                    universeId: universeId,
                    solarSystemId: solarsystemId,
                    type: star.type,
                    luminosity: toInteger(star.luminosity),
                    color: toInteger(hexToNumber(star.color)),
                    diameter: toInteger(star.radiusMeters*2),
                    temperature: toInteger(star.temperatureK),
                    habitableZoneStart: toInteger(star.habitableZoneMeters.start),
                    habitableZoneEnd: toInteger(star.habitableZoneMeters.end)}
                );
            for (const planet of solarsystem.planets) {
                const planetId = planet.id;
                let hasAnalyze = false;
                if (planet.type === 'habitable' && !homePlanetId) {
                    homePlanetId = planetId; // Set the first habitable planet as home
                    hasAnalyze = true; // Mark it as analyzed
                    solarSystemPush[solarSystemPush.length - 1].hasAnalyze = true; // Mark the solar system as analyzed
                }
                planetPush.push({
                    id: planetId,
                    name: planet.name,
                    universeId: universeId,
                    solarSystemId: solarsystemId,
                    starId: starId,
                    distance: toInteger(planet.distanceMeters),
                    diameter: toInteger(planet.sizeMeters*2),
                    type: planet.type,
                    temperature: toInteger(planet.temperatureK),
                    resources: {...planet.atmosphere, ...planet.resources},
                    color: toInteger(hexToNumber(planet.color)),
                    hasRing: planet.hasRing,
                    gravity: toInteger(planet.gravity*1000),
                    density: toInteger(planet.density*1000),
                    mass: sciToInteger(planet.mass),
                    pressure: toInteger(planet.pressure*1000),
                    hasAnalyze: hasAnalyze}
                );
                for (const moon of planet.moons) {
                    moonPush.push({
                        id: moon.id,
                        name: moon.name,
                        universeId: universeId,
                        solarSystemId: solarsystemId,
                        planetId: planetId,
                        distance: toInteger(moon.distanceMeters),
                        diameter: toInteger(moon.sizeMeters*2),
                        resources: moon.resources,
                        color: toInteger(hexToNumber(moon.color))}
                    );
                }
            }
        }
		// puis crée en base
		await solarSystemDB.bulkCreate(solarSystemPush);
		log.s('Solar systems created successfully');

		await starDB.bulkCreate(starPush);
		log.s('Stars created successfully');

		await planetDB.bulkCreate(planetPush);
		log.s('Planets created successfully');

		await moonDB.bulkCreate(moonPush);
		log.s('Moons created successfully');

		log.s('Universe created successfully');
        const newGuild = await guildDB.create({
			id: discordServerID,
			name: guildName,
			owner: user.id,
            universeId: universeId, // Initially no universe
            homePlanetId: homePlanetId, // Set the home planet ID
			members: {}
		});
        await user.update({ guild: newGuild.id });
		ws.send(JSON.stringify({ success: true, data: { guild: newGuild, universe }, requestID }));

	} catch (err) {
		log.e('Erreur dans createGuildProcess:', err);
        //test si le format de l'erreur est { success, data }
        if (err.success && err.data) {
            err.requestID = requestID;
            ws.send(JSON.stringify(err));
            return;
        }
		ws.send(JSON.stringify({ success: false, data: 'error creating guild', requestID }));
	}
}
        


function hexToNumber(hex) {
    hex = hex.replace('#', '');
    return parseInt(hex, 16);
}
function numberToHex(number) {
    return '#' + number.toString(16).padStart(6, '0');
}
function toInteger(value) {
    if (typeof value === 'number') {
        return Math.floor(value);
    } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}
function sciToInteger(value) {
    value = value.toExponential(4);
    const parts = value.split('e');
    const base = parseFloat(parts[0]);
    const exponent = parseInt(parts[1], 10);
    const result = exponent + "0" + base.toString().replace('.', '');
    return parseInt(result, 10);
}
function integerToSci(value) {
    if (value === 0) return '0';
    value = value.toString();
    const base = value.slice(-5);
    const exponent = value.slice(0, -6);
    return base/1000 *10**exponent
}