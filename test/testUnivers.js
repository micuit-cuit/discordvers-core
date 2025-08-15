module.exports = function (ws,userID) {
    ws.init();
    ws.sendAndAwait({
        route: '/guild/universe/get',
        requestID: 1,
        user: userID,
        data: {
            userID: userID,
            discordServerID: "1332329400359714839"
        }
    },(res) => {
        console.log(JSON.stringify(res, null, 2));
        const solarSystemID = res.data.systems[0].id
        console.log('Solar System ID:', solarSystemID);
        ws.sendAndAwait({
            route: '/guild/universe/solarSystem/get',
            requestID: 2,
            user: userID,
            data: {
                userID: userID,
                solarSystemID: solarSystemID
            }
        }, (res) => {
            console.log(JSON.stringify(res, null, 2));
            const solarSystem = res.data;
            const starID = res.data.star.id;
            console.log('Star ID:', starID);
            ws.sendAndAwait({
                route: '/guild/universe/solarSystem/star/get',
                requestID: 3,
                user: userID,
                data: {
                    userID: userID,
                    starID: starID
                }
            }, (res) => {
                console.log(JSON.stringify(res, null, 2));
                const planetID = solarSystem.planets[1].id;
                console.log('Planet ID:', planetID);
                ws.sendAndAwait({
                    route: '/guild/universe/solarSystem/planet/get',
                    requestID: 4,
                    user: userID,
                    data: {
                        userID: userID,
                        planetID: planetID
                    }
                }, (res) => {
                    console.log(JSON.stringify(res, null, 2));
                    const moonID = res.data.moons[0].id;
                    console.log('Moon ID:', moonID);
                    ws.sendAndAwait({
                        route: '/guild/universe/solarSystem/planet/moon/get',
                        requestID: 5,
                        user: userID,
                        data: {
                            userID: userID,
                            moonID: moonID
                        }
                    }, (res) => {
                        console.log(JSON.stringify(res, null, 2));
                        ws.close();
                    });
                });
            });
        });
    })

}