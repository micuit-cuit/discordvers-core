const Sequelize = require('sequelize');
module.exports = {
    logging: false,
    Database: {//exemple of database config
        dialect: 'sqlite',
        storage: './db/database.sqlite',
        logging: false,
        define: {
            timestamps: true
        },
    },
    Model: {
        user: {// est la table des utilisateurs
            id: {// est l'id discord de l'utilisateur, est unique, est non null 
                type: Sequelize.STRING,
                primaryKey: true,
            },
            inventory: { // est l'id de l'inventaire de l'utilisateur, est non null, a une relation avec la table inventory
                type: Sequelize.INTEGER,
                references: {
                    model: 'inventory',
                    key: 'id'
                }
            },
            guild: {// est l'id de la guilde de l'utilisateur, est non null, a une relation avec la table guild
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'guild',
                    key: 'id'
                }
            },
            money: {// est l'argent de l'utilisateur, est non null, est un integer
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            xp: {// est l'xp de l'utilisateur, est non null, est un integer
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            actualPositionPlanet: {// est la position de l'utilisateur, est non null, a une relation avec la table planet
                type: Sequelize.STRING,
                allowNull: true,
                references: {
                    model: 'planet',
                    key: 'id'
                }
            },
            actualPosition:{
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {x: 0, y: 0}
            }
        },
        inventory: {// est la table des inventaires
            id: {// est l'id de l'inventaire, est unique, est non null
                type: Sequelize.STRING,
                primaryKey: true,
            },
            ...Array.from({ length: 20 }, (_, i) => ({// est un tableau de 20 slots, est non null, a une relation avec la table item
                [`slot${i + 1}`]: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                    references: {
                        model: 'item',
                        key: 'id'
                    }
                }
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        },
        item: {// est la table des items
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
            },
            key: {
                type: Sequelize.STRING,
                allowNull: false
            },
            price: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false
            }
        },
        guild: {// est la table des guildes
            id: {// est l'id de la guilde, est unique, est non null
                type: Sequelize.STRING,
                primaryKey: true,
            },
            name: {// est le nom de la guilde, est unique, est non null
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            owner: {// est l'id du propriétaire de la guilde, est non null, a une relation avec la table user
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id'
                }
            },
            members: {// est un tableau des membres de la guilde, est non null, a une relation avec la table user
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {},
            },
            universeId: {// est l'id de l'univers de la guilde, est non null, a une relation avec la table universe
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
                references: {
                    model: 'universe',
                    key: 'id'
                }
            },
            homePlanetId: {// est l'id de la planète d'accueil de la guilde, est non null, a une relation avec la table planet
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'planet',
                    key: 'id'
                }
            }
        },
        invite: {// est la table des invitations
            id: {// est l'id de l'invitation, est unique, est non null
                type: Sequelize.STRING,
                primaryKey: true,
            },
            guild: {// est l'id de la guilde de l'invitation, est non null, a une relation avec la table guild
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'guild',
                    key: 'id'
                }
            },
            user: {// est l'id de l'utilisateur de l'invitation, est non null, a une relation avec la table user
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id'
                }
            },
            user2: {// est l'id du deuxième utilisateur de l'invitation, est non null, a une relation avec la table user
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id'
                }
            },
            useNumber: {// est le nombre d'utilisation de l'invitation, est non null, est un integer
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        },
        universe: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false
            }
        },
        solarSystem: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            posX: {//position X du système solaire dans l'univers
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            posY: {//position Y du système solaire dans l'univers
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            posZ: {//position Z du système solaire dans l'univers
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            universeId: {
                type: Sequelize.STRING,
                references: {
                    model: "universe",
                    key: 'id'
                },
                allowNull: false
            },
            hasAnalyze: {//indique si la planète a été analysée
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        planet: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            starId: {
                type: Sequelize.STRING,
                references: {
                    model: "star",
                    key: 'id'
                },
                allowNull: false
            },
            universeId: {
                type: Sequelize.STRING,
                references: {
                    model: "universe",
                    key: 'id'
                },
                allowNull: false
            },
            solarSystemId: {
                type: Sequelize.STRING,
                references: {
                    model: "solarSystem",
                    key: 'id'
                },
                allowNull: false
            },
            distance: {//distance de la planète par rapport à l'étoile
                type: Sequelize.BIGINT,
                allowNull: false
            },
            diameter: {//diamètre de la planète
                type: Sequelize.BIGINT,
                allowNull: false
            },
            type: {//type de la planète
                type: Sequelize.ENUM('rocky', 'habitable', 'gas_giant'),
                allowNull: false
            },
            temperature: {//température de la planète
                type: Sequelize.INTEGER,
                allowNull: false
            },
            resources: {//atmosphère de la planète
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {}
            },
            color: {//couleur de la planète
                type: Sequelize.INTEGER,
                allowNull: false
            },
            hasRing: {//indique si la planète a des anneaux
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            gravity: {//gravité de la planète
                type: Sequelize.INTEGER,//float multiplié par 1000
                allowNull: false,
                defaultValue: 1000 // 1g = 1000
            },
            dencity: {//densité de la planète
                type: Sequelize.INTEGER,//float multiplié par 1000
                allowNull: false,
                defaultValue: 5500 // 5.5g/cm3 = 5500
            },
            mass: {//masse de la planète
                type: Sequelize.INTEGER,// pour 2.2564e+24, on met 2402564
                                        // on utilise le prenier pack de 0 et le dernier pour ce pack, pour deduire l'exposant
                                        // par exemple, pour 3.2654e+10, sa donne 10032654 < decouper au 1er nombre (3) et metre la virgule ici (3.2654)
                                        //                                 exposent^^separateur
                allowNull: false
            },
            pressure: {//pression de la planète
                type: Sequelize.INTEGER,//float multiplié par 1000
                allowNull: false
            },
            hasAnalyze: {//indique si la planète a été analysée
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        moon: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            universeId: {
                type: Sequelize.STRING,
                references: {
                    model: "universe",
                    key: 'id'
                },
                allowNull: false
            },
            solarSystemId: {
                type: Sequelize.STRING,
                references: {
                    model: "solarSystem",
                    key: 'id'
                },
                allowNull: false
            },
            planetId: {
                type: Sequelize.STRING,
                references: {
                    model: "planet",
                    key: 'id'
                },
                allowNull: false
            },
            distance: {//distance de la lune par rapport à la planète
                type: Sequelize.INTEGER,
                allowNull: false
            },
            diameter: {//diamètre de la lune
                type: Sequelize.INTEGER,
                allowNull: false
            },
            resources: {//atmosphère de la lune
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {}
            },
            color: {//couleur de la lune
                type: Sequelize.INTEGER,
                allowNull: false
            },
            hasAnalyze: {//indique si la planète a été analysée
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        star: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            solarSystemId: {
                type: Sequelize.STRING,
                references: {
                    model: "solarSystem",
                    key: 'id'
                },
                allowNull: false
            },
            universeId: {
                type: Sequelize.STRING,
                references: {
                    model: "universe",
                    key: 'id'
                },
                allowNull: false
            },
            type: {//type de l'étoile
                type: Sequelize.CHAR(1),
                allowNull: false
            },
            luminosity: {//luminosité de l'étoile
                type: Sequelize.INTEGER,
                allowNull: false
            },
            color: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            diameter: {//diameter de l'étoile
                type: Sequelize.BIGINT,
                allowNull: false
            },
            temperature: {//température de l'étoile
                type: Sequelize.INTEGER,
                allowNull: false
            },
            habitableZoneStart: {//début de la zone habitable
                type: Sequelize.BIGINT,
                allowNull: false
            },
            habitableZoneEnd: {//fin de la zone habitable
                type: Sequelize.BIGINT,
                allowNull: false
            },
            hasAnalyze: {//indique si la planète a été analysée
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }   
        },
        spacecraft: {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            userId: {
                type: Sequelize.STRING,
                references: {
                    model: "user",
                    key: 'id'
                }
            },
            universeId: {
                type: Sequelize.STRING,
                references: {
                    model: "universe",
                    key: 'id'
                }
            },   
            horbitPlanetId: {
                type: Sequelize.STRING,
                references: {
                    model: "planet",
                    key: 'id'
                },
                allowNull: true
            },
            horbitMoonId: {
                type: Sequelize.STRING,
                references: {
                    model: "moon",
                    key: 'id'
                },
                allowNull: true
            },
            horbitStarId: {
                type: Sequelize.STRING,
                references: {
                    model: "star",
                    key: 'id'
                },
                allowNull: true
            },
            position: {//position du vaisseau dans l'univers
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {x: 0, y: 0, z: 0}
            },
            speed: {//vitesse du vaisseau
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            fuel: {//carburant du vaisseau
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 100
            },
            atomicFuel: {//carburant atomique du vaisseau pour changer de système solaire
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            qwantumFuel: {//carburant quantique du vaisseau pour changer d'univers
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            cargo: {//cargo du vaisseau, est un tableau de 20 slots, est non null, a une relation avec la table item
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: Array.from({ length: 20 }, () => null)
            },
            maxCargo: {//capacité maximale du cargo du vaisseau
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 20
            },
        }
    }
};
