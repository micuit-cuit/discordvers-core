require('json5/lib/register')
const snowflake = require('./snowflake.js');
const universeSetting = require('../config/universeSetting.json5')
const G = 6.67430e-11; // constante gravitationnelle

class Universe {
    constructor() {
        this.systems = [];
        this.hasHabitablePlanet = false; // pour savoir si on a déjà généré une planète habitable
    }
    generateSystem(starType, numPlanets = null) {
        const star = new Star(starType);
        const system = new SolarSystem(star , this.hasHabitablePlanet? Universe.randomBool() : true);
        this.hasHabitablePlanet = true; // on a généré un système, donc on peut avoir une planète habitable
        numPlanets = numPlanets || Universe.randomInt(3, 6); // 3 à 10 planètes par système
        system.generatePlanets(numPlanets);
        this.systems.push(system);
        return system;
    }
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    static randomBool = () => Math.random() > 0.5;
    toJSON() {
        return {
            systems: this.systems.map(s => s.toJSON()),
            hasHabitablePlanet: this.hasHabitablePlanet
        };
    }   
}

class SolarSystem {
    constructor(star, hasHabitablePlanet = false) {
        this.star = star;
        this.planets = [];
        this.hasHabitablePlanet = hasHabitablePlanet;
        this.id = snowflake('universeSolarSystem').str;
    }
    generatePlanets(num) {
        // Distance minimale en UA (pour simplifier) puis convertie en mètres
        // Nous générons des planètes avec des distances croissantes, un peu aléatoires
        let baseDistanceUA = 0.3;
        let lastDistance = baseDistanceUA;
        const habitableZone = this.star.habitableZone;
        
        for (let i = 0; i < num; i++) {
            if (this.hasHabitablePlanet && baseDistanceUA+ i * 0.3 > habitableZone.start) {
                // Si on a une planète habitable, on la place dans la zone habitable
                baseDistanceUA = habitableZone.start + Universe.randomFloat(0, habitableZone.end - habitableZone.start);
                const type = 'habitable';
                const sizeMeters = Universe.randomFloat(0.8, 1.2) * 6.371e6; // taille entre 0.8 et 1.2 Terre
                const distanceMeters = baseDistanceUA * 1.496e11; // convertion en mètres
                const planet = new Planet({
                    distanceMeters,
                    sizeMeters,
                    type,
                    star: this.star,
                    universeSetting
                });
                this.planets.push(planet);
                this.hasHabitablePlanet = false; // on a créé la planète habitable, on ne la recrée pas
                lastDistance = habitableZone.start; // mettre à jour la dernière distance
                continue; // on passe à la prochaine planète
            }
            let distanceUA = baseDistanceUA + i * Universe.randomFloat(0.3, 0.9);
            // Convertir UA en mètres (1 UA ~ 1.496e11 m)
            let distanceMeters = distanceUA * 1.496e11;
            // Pour éviter les distances trop proches, on test si la distance est trop proche de la précédente
            if (i > 0 && distanceMeters < lastDistance * 1.2) {
                // Si trop proche, on augmente la distance de 20% par rapport à la dernière
                distanceMeters = lastDistance * 1.2;
                distanceUA = distanceMeters / 1.496e11; // reconvertir en UA
            }
            lastDistance = distanceMeters;
            // Taille de la planète en m, basée sur position (proche = plus petite généralement)
            // Terrestre = 6.371e6 m rayon Terre
            let sizeMeters = 0;
            let type = 'rocky';

            if (distanceUA < 2) {
                // Planète rocheuse, taille entre 0.3 et 1.5 Terre
                sizeMeters = Universe.randomFloat(0.3, 1.5) * 6.371e6;
                type = 'rocky';
            } else {
                // Gazeuse, taille entre 3 et 15 Terre
                sizeMeters = Universe.randomFloat(3, 15) * 6.371e6;
                type = 'gas_giant';
            }
            // Créer planète en respectant la composition
            const planet = new Planet({
                distanceMeters,
                sizeMeters,
                type,
                star: this.star,
                universeSetting
            });
            this.planets.push(planet);
        }
    }
    toJSON() {
        return {
            star: this.star.toJSON(),
            planets: this.planets.map(p => p.toJSON())
        };
    }
}

class Star {
    constructor(type, name = null, id = null) {
        this.type = type;
        this.name = name || this.generateName();
        this.id = id ?? snowflake('universeStar').str;
        function zoneHabitable(luminosity) {
            // Calcul de la zone habitable en UA
            const start = Math.sqrt(luminosity / 1.3); // limite intérieure
            const end = Math.sqrt(luminosity / 1); // limite extérieure
            return { start, end };
        }
        // Exemple : définir luminosité et masse selon type (simplifié)
        const typesData = {
            'O': { 
                mass: 16, 
                luminosity: 30000, 
                color: '#9bb0ff',
                habitableZone: zoneHabitable(30000)
            },
            'B': { 
                mass: 2.1, 
                luminosity: 25, 
                color: '#aabfff',
                habitableZone: zoneHabitable(25)
            },
            'A': { 
                mass: 1.4, 
                luminosity: 5, 
                color: '#cad7ff',
                habitableZone: zoneHabitable(5)
            },
            'F': { 
                mass: 1.04, 
                luminosity: 1.5, 
                color: '#f8f7ff',
                habitableZone: zoneHabitable(1.5)
            },
            'G': { 
                mass: 1.0, 
                luminosity: 1.0, 
                color: '#fff4ea',
                habitableZone: zoneHabitable(1.0)
            },
            'K': { 
                mass: 0.8, 
                luminosity: 0.4, 
                color: '#ffd2a1',
                habitableZone: zoneHabitable(0.4)
            },
            'M': { 
                mass: 0.3, 
                luminosity: 0.04, 
                color: '#ffcc6f',
                habitableZone: zoneHabitable(0.04)
            }
        }

        const data = typesData[type.toUpperCase()] || typesData['G'];
        this.mass = data.mass; // masse en masse solaire (simplifié)
        this.luminosity = data.luminosity; // luminosité relative soleil
        this.color = data.color;
        this.habitableZone = data.habitableZone || { start: 0.95, end: 1.37 }; // en UA
        this.radiusMeters = Math.sqrt(this.mass) * 6.96e8; // rayon en mètres (simplifié)
        this.temperatureK = 5778 * Math.sqrt(this.luminosity); // température en Kelvin (simplifié)
        this.temperatureC = this.temperatureK - 273.15; // température en Celsius
    }
    generateName() {
        // Génération simple de nom d'étoile
        const syllables = ['Al', 'Bet', 'Gam', 'Del', 'Eps', 'Zet', 'Eta', 'The', 'Iot', 'Kap'];
        return syllables[Math.floor(Math.random() * syllables.length)] + '-' + Math.floor(Math.random() * 1000);
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            mass: this.mass,
            luminosity: this.luminosity,
            color: this.color,
            radiusMeters: this.radiusMeters,
            temperatureK: this.temperatureK,
            temperatureC: this.temperatureC,
            habitableZone: this.habitableZone,
            habitableZoneMeters: {
                start: this.habitableZone.start * 1.496e11, // conversion en mètres
                end: this.habitableZone.end * 1.496e11 // conversion en mètres
            }
        };
    }
}

class Planet {
    constructor({ distanceMeters, sizeMeters, type, star, universeSetting }) {
        this.distanceMeters = distanceMeters;
        this.sizeMeters = sizeMeters;
        this.type = type;
        this.star = star;
        this.universeSetting = universeSetting;
        this.id = snowflake('universePlanet').str;
        this.name = this.generateName();

        this.radiusMeters = this.sizeMeters / 2;

        this.atmosphere = this.generateAtmosphere(); // gaz et proportions
        this.temperatureK = this.calcTemperature();
        this.temperatureC = this.temperatureK - 273.15;
        this.resources = this.generateResources(); // ressources et proportions



        this.massDensity = this.calcMassDensity(); // kg/m³
        this.mass = this.calcMass(); // kg
        this.gravity = this.calcGravity(); // m/s²
        this.pressure = this.calcPressure(); // Pa
        this.color = this.computeColor();
        this.hasRing = this.generateRing();
        const moonCount = Universe.randomInt(0, 3); // entre 0 et 3 lunes
        this.moons = [];
        for (let i = 0; i < moonCount; i++) {
            const moonDistance = Universe.randomFloat(0.1, 0.5) * this.radiusMeters; // distance de la lune entre 10% et 50% du rayon de la planète
            const moonSize = Universe.randomFloat(0.1, 0.3) * this.sizeMeters; // taille de la lune entre 10% et 30% de la taille de la planète
            const moon = new Moon({
                distanceMeters: moonDistance,
                sizeMeters: moonSize,
                planet: this,
                universeSetting
            });
            this.moons.push(moon);
        }
    }

    calcMassDensity() {
        let totalWeight = 0;
        let totalDensity = 0;

        // Densités des matériaux solides
        for (const [key, fraction] of Object.entries(this.resources)) {
            const density = this.universeSetting.materialDensity[key] || 0;
            totalDensity += density * fraction;
            totalWeight += fraction;
        }

        // Pour les géantes gazeuses, on ajoute la densité des gaz dans l’atmosphère (pondéré par leur fraction)
        if (this.type === 'gas_giant' && this.atmosphere) {
            for (const [gaz, fraction] of Object.entries(this.atmosphere)) {
                const gasDensity = this.universeSetting.gazDensity[gaz] || 0;
                totalDensity += gasDensity * fraction;
                totalWeight += fraction;
            }
            totalDensity /= 2.7; // on réduit la densité pour les géantes gazeuses
        }

        // Si aucune ressource ni gaz détecté, valeurs par défaut selon type
        if (totalWeight === 0) {
            if (this.type === 'rocky' || this.type === 'habitable') return 5500;
            if (this.type === 'gas_giant') return 1300;
            return 5000;
        }

        return totalDensity / totalWeight;
    }


    calcMass() {
        const volume = (4 / 3) * Math.PI * Math.pow(this.radiusMeters, 3);
        return this.massDensity * volume;
    }

    calcGravity() {
        let multiplier = 1;
        if (this.type === 'gas_giant') {
            // Pour les géantes gazeuses, on utilise une gravité beaucoup plus forte
            multiplier = 25; // exemple de facteur pour géantes gazeuses
        }
        const gravity = (G * this.mass) / Math.pow(this.radiusMeters, 2);
        return  gravity < 1? (Math.random()+1) * multiplier : gravity * multiplier; // on ne veut pas de gravité négative ou nulle
    }

    // Estimation pression atmosphérique en Pa basée sur composition atmosphérique et gravité
    calcPressure() {
        // Masse volumique moyenne de l'air de la planète (kg/m³)
        let atmDensity = 0;
        let totalFraction = 0;
        for (const [gaz, fraction] of Object.entries(this.atmosphere)) {
            const densGaz = this.universeSetting.gazDensity[gaz] || 0;
            atmDensity += densGaz * fraction;
            totalFraction += fraction;
        }
        if (totalFraction === 0) return 0; // pas d'atmosphère

        atmDensity /= totalFraction;

        // Pression relative : on prend pression Terre 101325 Pa à 1 atm et 9.81 m/s²
        // On scale par gravité relative
        const pressure = 101325 * atmDensity * (this.gravity / 9.81);

        return pressure;
    }

    generateName() {
        const prefixes = ['Xan', 'Tor', 'Vel', 'Zyn', 'Nex', 'Cry', 'Sol', 'Ryn', 'Myn', 'Lun'];
        const suffixes = ['os', 'ar', 'ia', 'on', 'um', 'ex', 'is', 'or', 'us', 'en'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    generateResources() {
        const resources = {};

        const temp = this.temperatureK;
        const type = this.type;
        const gases = this.atmosphere || {};
        const existingResources = {};
        if (type == 'gas_giant') {
            // Pour les géantes gazeuses, on ne génère pas de ressources solides
            return {};
        }

        for (const resource in this.universeSetting.resourceSettings) {
            const setting = this.universeSetting.resourceSettings[resource];
            // Vérifier le type de planète si spécifié
            if (setting.validPlanetTypes && !setting.validPlanetTypes.includes(type)) {
                continue;
            }

            // Vérifier la température
            if (setting.temperatureRange) {
                const [min, max] = setting.temperatureRange;
                if (temp < min || temp > max) continue;
            }

            // Calcul de l'influence
            let influence = 0.5;

            if (setting.resourceInfluenceRange) {
                for (const key in setting.resourceInfluenceRange) {
                    const [min, max] = setting.resourceInfluenceRange[key];
                    const value =
                        gases[key] ?? existingResources[key] ?? 0;

                    // Si la valeur est dans la plage, elle contribue
                    if (value >= min && value <= max) {
                        influence *= 1 + (value - min) / (max - min); // contribution normalisée
                    } else {
                        influence *= 0.5; // pénalité si hors plage
                    }
                }
            }

            // Génère une "richesse" entre 0.1 et 1.0 influencée
            const richness = +(Math.min(1, Math.max(0.1, Math.random() * influence))).toFixed(2);
            resources[resource] = richness;

            // stocker pour influence des ressources suivantes
            existingResources[resource] = richness;
        }
        if (type == 'habitable') {
            // Pour les planètes habitables, on force la présence d'eau et d'organique
            resources['resource.water'] = Universe.randomFloat(0.5, 1.0); // eau entre 50% et 100%
            resources['resource.organicMatter'] = Universe.randomFloat(0.3, 0.7); // matière organique entre 30% et 70%
        }
        return resources;
    }

    calcTemperature() {
        const sigma = 5.670374419e-8;
        const L = this.star.luminosity * 3.828e26;
        const d = this.distanceMeters;

        // Température d’équilibre sans atmosphère
        const T_eq = Math.pow(L / (16 * Math.PI * sigma * d * d), 0.25);

        // Influence des gaz (si atmosphère définie)
        const atmosphere = this.atmosphere || {};
        let greenhouseMultiplier = 1;

        const gazEffect = {
            "gaz.CO2": 1.02,
            "gaz.CH4": 1.04,
            "gaz.NH3": 1.05,
            "gaz.H2O": 1.03,
            "gaz.SO2": 0.98,
            "gaz.O3": 1.01,
            "gaz.O2": 1.00,
            "gaz.N2": 1.00,
            "gaz.H2": 1.00,
            "gaz.He": 1.00,
            "gaz.HCN": 1.03
        };

        for (const gaz in atmosphere) {
            const effect = gazEffect[gaz] || 1.0;
            greenhouseMultiplier += (effect - 1.0) * atmosphere[gaz];
        }

        const T_final = T_eq * greenhouseMultiplier;
        return T_final
    }

    generateAtmosphere() {
        const baseGaz = this.universeSetting.baseGaz[this.type];
        const gazInfluence = this.universeSetting.gazInfluence;
        if (this.type === 'habitable') {
            // Pour les planètes habitables, on crée une composition atmosphérique composer seulement de gaz favorables
            return randomizeAtmosphere(this.universeSetting.baseGaz.habitable);
        }


        const possibleGaz = {};

        // Ajoute les gaz de base avec un poids initial plus élevé
        for (const gaz of baseGaz) {
            if (!possibleGaz[gaz]) {
                possibleGaz[gaz] = 1.5; // boost de base
            } else {
                possibleGaz[gaz] += 1.5;
            }

            // Influence des gaz de base
            const influences = gazInfluence[gaz] || {};
            for (const gazOutput in influences) {
                if (!possibleGaz[gazOutput]) {
                    possibleGaz[gazOutput] = 0;
                }
                possibleGaz[gazOutput] += influences[gazOutput];
            }
        }

        // Ajoute un petit bruit aléatoire pour diversité
        for (const gaz in possibleGaz) {
            possibleGaz[gaz] += Math.random() * 0.2;
        }

        // Tirage probabiliste pondéré
        const prosessGaz = {};
        for (const gaz in possibleGaz) {
            // tirage * poids pour générer biais
            prosessGaz[gaz] = Math.random() * possibleGaz[gaz];
        }

        // Nombre de gaz entre 3 et 5 (plus réaliste)
        const nbGaz = Math.floor(Math.random() * 3) + 3;

        // Trier par probabilité décroissante
        const sortedGaz = Object.entries(prosessGaz).sort((a, b) => b[1] - a[1]);
        const selectedGaz = sortedGaz.slice(0, nbGaz);

        const selectedKeys = selectedGaz.map(e => e[0]);

        for (const [gazA, gazB] of this.universeSetting.incompatiblePairs) {
            if (selectedKeys.includes(gazA) && selectedKeys.includes(gazB)) {
                // Retire le gaz le moins probable
                const remove = prosessGaz[gazA] < prosessGaz[gazB] ? gazA : gazB;
                delete prosessGaz[remove];
            }
        }

        // Re-normaliser la sélection après retrait
        const finalGaz = Object.entries(prosessGaz)
            .sort((a, b) => b[1] - a[1])
            .slice(0, nbGaz);

        const atmosphere = {};
        let total = 0;
        for (const [gaz, value] of finalGaz) {
            atmosphere[gaz] = value;
            total += value;
        }

        // Normalisation (somme à 1, arrondie à 2 décimales)
        for (const gaz in atmosphere) {
            atmosphere[gaz] = +(atmosphere[gaz] / total).toFixed(2);
        }

        return atmosphere;
    }



computeColor() {
    // Mélange les couleurs des gaz et des ressources avec leur proportion et alpha

    function hexToRgba(hex) {
        const cleanHex = hex.replace('#', '');
        const bigint = parseInt(cleanHex, 16);
        let r, g, b, a = 255;

        if (cleanHex.length === 8) {
            r = (bigint >> 24) & 255;
            g = (bigint >> 16) & 255;
            b = (bigint >> 8) & 255;
            a = bigint & 255;
        } else {
            r = (bigint >> 16) & 255;
            g = (bigint >> 8) & 255;
            b = bigint & 255;
        }

        return [r, g, b, a / 255];
    }

    function rgbaToHex(r, g, b, a) {
        const toHex = (v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    const gazSetting = this.universeSetting.gaz;
    const resourceSettings = this.universeSetting.resourceSettings;

    let totalWeight = 0;
    let r = 0, g = 0, b = 0;


    for (const [gaz, proportion] of Object.entries(this.atmosphere)) {
        const colorHex = gazSetting[gaz]?.color || '#888888FF';
        const colorBouste = gazSetting[gaz]?.colorBouste || false
        const [cr, cg, cb, ca] = hexToRgba(colorHex);
        
        const weight = proportion * ca * colorBouste? 100:1
        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    }

    for (const [resource, proportion] of Object.entries(this.resources)) {
        const colorHex = resourceSettings[resource]?.color || '#888888FF';
        const [cr, cg, cb] = hexToRgba(colorHex);
        const weight = proportion;
        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) totalWeight = 1; // Évite division par zéro

    r = Math.min(255, r / totalWeight);
    g = Math.min(255, g / totalWeight);
    b = Math.min(255, b / totalWeight);

    return rgbaToHex(r, g, b, 1); // rendu final opaque (alpha à 1)
}


    generateRing() {
        if (this.type === 'gas_giant' || this.type === 'icy') {
            return Math.random() < 0.4; // 40% de chance
        }
        return Math.random() < 0.05; // faible chance sur rocheuses
    }







    toJSON() {
        return {
            id: this.id,
            name: this.name,
            distanceMeters: this.distanceMeters,
            sizeMeters: this.sizeMeters,
            type: this.type,
            temperatureK: this.temperatureK,
            temperatureC: this.temperatureC,
            atmosphere: this.atmosphere,
            color: this.color,
            hasRing: this.hasRing,
            resources: this.resources,
            gravity: this.gravity,
            massDensity: this.massDensity,
            mass: this.mass,
            pressure: this.pressure,
            moons: this.moons.map(m => m.toJSON())
        };
    }
}

class Moon {
    constructor({ distanceMeters, sizeMeters, planet, universeSetting }) {
        this.distanceMeters = distanceMeters;
        this.sizeMeters = sizeMeters;
        this.planet = planet;
        this.universeSetting = universeSetting;
        this.id = snowflake('universeMoon').str;
        this.name = this.generateName();
        this.resources = this.generateResources(); // ressources et proportions
        this.color = this.generateColor(); // couleur basée sur la composition du sol
    }
    generateName() {
        const prefixes = ['Lun', 'Sel', 'Ast', 'Gal', 'Cry', 'Nex', 'Zyn', 'Tor', 'Vel', 'Ryn'];
        const suffixes = ['os', 'ar', 'ia', 'on', 'um', 'ex', 'is', 'or', 'us', 'en'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    generateResources() {
        const moonFloor = this.universeSetting.moonFloor;
        const resourceValues = {};
        for (const [key, { min, max }] of Object.entries(moonFloor)) {
            resourceValues[key] = (Math.random() * (max - min) + min).toFixed(2);
        }
        //test si il doit y avoir de l'eau
        if (Universe.randomBool()) {
            resourceValues['water'] = 0
        }
        //notmaliser pour que la somme fasse 1
        const total = Object.values(resourceValues).reduce((sum, value) => sum + parseFloat(value), 0);
        for (const key in resourceValues) {
            resourceValues[key] = +(resourceValues[key] / total).toFixed(2);
        }
        return resourceValues;
    }
    generateColor() {
        // Couleur de la lune basée sur la composition du sol
        const moonFloor = this.universeSetting.moonFloor;
        let r = 0, g = 0, b = 0, totalOpacity= 0;
        for (const [resource, proportion] of Object.entries(this.resources)) {
            const colorHex = moonFloor[resource]?.color || '#888888';
            const opacity = moonFloor[resource]?.opacity || 0.5;
            const rgb = this.hexToRgb(colorHex);
            r += rgb[0] * proportion * opacity; 
            g += rgb[1] * proportion * opacity;
            b += rgb[2] * proportion * opacity;
            totalOpacity += proportion * opacity;
        }
        if (totalOpacity > 0) {
            r /= totalOpacity;
            g /= totalOpacity;
            b /= totalOpacity;
        }
        return this.rgbToHex(r, g, b);
    }
    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            distanceMeters: this.distanceMeters,
            sizeMeters: this.sizeMeters,
            planetId: this.planet.id,
            resources: this.resources,
            color: this.color
        };
    }
}

// Bool random helper
// Universe.randomBool = () => Math.random() > 0.5;
function randomizeAtmosphere(baseAtmosphere) {
    // Applique un bruit aléatoire léger sur chaque gaz
    const noisyAtmosphere = {};
    let total = 0;

    for (const gaz in baseAtmosphere) {
        // Appliquer un facteur entre 0.8 et 1.2 pour un peu de variation
        const randomFactor = 0.8 + Math.random() * 0.4;
        noisyAtmosphere[gaz] = baseAtmosphere[gaz] * randomFactor;
        total += noisyAtmosphere[gaz];
    }

    // Normaliser pour que la somme fasse 1
    for (const gaz in noisyAtmosphere) {
        noisyAtmosphere[gaz] = +(noisyAtmosphere[gaz] / total).toFixed(2);
    }

    // Ajustement pour s'assurer que la somme soit exactement 1 (arrondi)
    const sumAfter = Object.values(noisyAtmosphere).reduce((a, b) => a + b, 0);
    if (sumAfter !== 1) {
        // Corriger la plus grosse valeur pour que la somme soit pile 1
        const maxGaz = Object.entries(noisyAtmosphere).reduce((max, cur) => cur[1] > max[1] ? cur : max);
        noisyAtmosphere[maxGaz[0]] += +(1 - sumAfter).toFixed(2);
    }

    return noisyAtmosphere;
}
function checkCollisions(system, margin = 1.2e5) {
    const celestialBodies = [];

    // Ajoute toutes les planètes
    for (const planet of system.planets) {
        celestialBodies.push({
            id: planet.id,
            name: planet.name,
            distance: planet.distanceMeters,
            radius: planet.sizeMeters / 2
        });

        // // Ajoute les lunes de la planète
        // for (const moon of planet.moons || []) {
        //     celestialBodies.push({
        //         id: moon.id,
        //         name: moon.name,
        //         distance: planet.distanceMeters + moon.distanceMeters,
        //         radius: moon.sizeMeters / 2
        //     });
        // }
    }

    const issues = [];

    for (let i = 0; i < celestialBodies.length; i++) {
        for (let j = i + 1; j < celestialBodies.length; j++) {
            const a = celestialBodies[i];
            const b = celestialBodies[j];
            const distanceBetween = Math.abs(a.distance - b.distance);
            const minDistance = a.radius + b.radius + margin;

            if (distanceBetween < minDistance) {
                issues.push({
                    type: "collision_or_too_close",
                    between: [a.name, b.name],
                    distanceBetween,
                    requiredMin: minDistance
                });
            }
        }
    }

    return issues;
}


function generateRandomUniverse(numSystems = Universe.randomInt(3, 7)) {
    const universe = new Universe();
    for (let i = 0; i < numSystems; i++) {
        const starType = ["O","B","H","I",'G', 'K', 'M'][Universe.randomInt(0, 6)]; // Choisir un type d'étoile aléatoire
        universe.generateSystem(starType);
        // Vérifier les collisions dans le système
        const system = universe.systems[universe.systems.length - 1];
        const issues = checkCollisions(system);
        if (issues.length > 0) {
            console.warn(`System ${system.id} (${system.star.name}) has issues:`, issues);
            i --; // Re-générer ce système
            universe.systems.pop(); // Retirer le système problématique
            continue; // Passer à la prochaine itération
        }
    }
    return universe;
}

// Export classes
module.exports = {
    Universe,
    SolarSystem,
    Star,
    Planet,
    Moon,
    generateRandomUniverse,
}

