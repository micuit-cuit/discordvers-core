const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'user' }, { style: 'circle', color: 'yellow', text: 'inventory' }, { style: 'circle', color: 'blue', text: 'getInventory' }]);
/* 
    @route: /user/inventory/get
    @name: getInventory
    @description: Get the inventory of the user
    @param: discordUserID
    @return: JSON Object {success, data: inventory}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const userDB = db.models.user;
    const inventoryDB = db.models.inventory;
    const itemDB = db.models.item;
    //check if user already exist
    userDB.findOne({ where: { id: userID } }).then((user) => {
        //récupère l'inventaire de l'utilisateur
        inventoryDB.findOne({ where: { id: user.inventory } }).then(async (inventory) => {            //pour chaque slot de l'inventaire, récupère l'item correspondant (les 20 slots en même temps)
            if (!inventory) {
                log.e('inventory not found for user:', userID);
                ws.send(JSON.stringify({ success: false, data: 'inventory not found', requestID }));
                return;
            }
            

            // Récupérer les clés des slots
            const slots = Object.keys(inventory.toJSON()).filter(key => key.startsWith('slot'));

            // Récupérer les IDs des items dans les slots
            const itemIDs = slots.map(slot => inventory[slot]);

            // Récupérer les informations des items correspondants depuis la table `item`
            const items = await itemDB.findAll({
                where: {
                    id: itemIDs.filter(id => id !== null), // Ignorer les slots vides
                },
            });

            // Créer un objet contenant chaque slot avec l'objet correspondant
            const inventoryWithItems = slots.reduce((acc, slot, index) => {
                const item = items.find(i => i.id === inventory[slot]) || null; // Trouver l'objet correspondant ou null
                acc[slot] = item;
                return acc;
            }, {});
            inventoryWithItems.id = inventory.id;

            ws.send(JSON.stringify({ success: true, data: inventoryWithItems, requestID }));
        }).catch((err) => {
            log.e('error finding inventory:', err);
            ws.send(JSON.stringify({ success: false, data: 'error finding inventory' ,requestID  }));
        });
    }).catch((err) => {
        log.e('error finding user:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding user',requestID  }));
    });
}
