const snowflake = require('../../lib/snowflake');
const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'user' }, { style: 'circle', color: 'blue', text: 'createUser' }]);
/* 
    @route: /user/create
    @name: createUser
    @description: Create a new user in the database
    @param: discordUserID
    @return: JSON Object {success, data: user}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, inputData, requestID) {
    const userDB = db.models.user;
    const inventoryDB = db.models.inventory;
    const itemDB = db.models.item;
    //check if user already exist
    userDB.findOne({ where: { id: inputData.userID.toString() } }).then((user) => {
        if (user) {
            ws.send(JSON.stringify({ success: false, data: 'user already exist', requestID }));
        } else {
            //create a new user
            //crée des pomme dans l'inventaire
            itemDB.create({
                id: snowflake("item").str,
                key: "item.apple",
                type: "food",
                price: 5,
                quantity: 5
            }).then((itemAppel) => {
                itemDB.create({
                    id: snowflake("item").str,
                    key: "item.carrot",
                    type: "food",
                    price: 3,
                    quantity: 2,
                }).then((itemCarrot) => {
                    inventoryDB.create({
                        id: snowflake("inventory").str,
                        slot20: itemAppel.id,
                        slot1: itemCarrot.id
                    }).then((inventory) => {
                        userDB.create({
                            id: inputData.userID.toString(),
                            inventory: inventory.id,
                            guild: null,
                            money: 0,
                            xp: 0
                        }).then((user) => {
                            log.s('user created with id:', inputData.userID);
                            ws.send(JSON.stringify({ success: true, data: user, requestID }));
                        }).catch((err) => {
                            inventoryDB.destroy({ where: { id: inventory.id } });
                            log.e('user already exist:', err);
                            ws.send(JSON.stringify({ success: false, data: 'user already exist----2' }, requestID));
                        });
                    }).catch((err) => {
                    log.e('error creating inventory:', err);
                    ws.send(JSON.stringify({ success: false, data: 'error creating inventory' }, requestID));
                });
                }).catch((err) => {
                    log.e('error creating item:', err);
                    ws.send(JSON.stringify({ success: false, data: 'error creating item' }, requestID));
                });
            }).catch((err) => {
                log.e('error creating item:', err);
                ws.send(JSON.stringify({ success: false, data: 'error creating item' }, requestID));
            });
        }
    }).catch((err) => {
        log.e('error finding user:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding user' }, requestID));
    });
}
