const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'user' }, { style: 'circle', color: 'yellow', text: 'inventory' }, { style: 'circle', color: 'blue', text: 'dropInventory' }]);
/* 
    @route: /user/inventory/drop
    @name: dropInventory
    @description: Drop an item from the inventory
    @param: discordUserID, slot (slot1 to slot20)
    @return: JSON Object {success, data: inventory}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const userDB = db.models.user;
    const inventoryDB = db.models.inventory;
    const itemDB = db.models.item;
    let { slot , quantity=2048 } = args;
    if (!slot) {
        log.e('missing slot');
        ws.send(JSON.stringify({ success: false, data: 'missing slot', requestID }));
        return;
    }
    if (!slot.startsWith('slot')) {
        log.e('slot is not a slot');
        ws.send(JSON.stringify({ success: false, data: 'slot is not a slot', requestID }));
        return;
    }
    //test si les slots sont bien des slots entre 1 et 20
    if (slot.replace('slot', '') < 1 || slot.replace('slot', '') > 20) {
        log.e('slot is not between 1 and 20');
        ws.send(JSON.stringify({ success: false, data: 'slot is not between 1 and 20', requestID }));
        return
    }
    //test si le nombre est bien un nombre entier supérieur à 0 et sans virgule
    if (quantity < 1 || quantity % 1 !== 0) {
        log.e('quantity is not an integer greater than 0');
        ws.send(JSON.stringify({ success: false, data: 'quantity is not an integer greater than 0', requestID }));
        return
    }
    log.d('dropping item from', slot);
    //check if user already exist
    userDB.findOne({ where: { id: userID } }).then((user) => {
        //récupère l'inventaire de l'utilisateur
        inventoryDB.findOne({ where: { id: user.inventory } }).then(async (inventory) => {            //pour chaque slot de l'inventaire, récupère l'item correspondant (les 20 slots en même temps)
            if (!inventory) {
                log.e('inventory not found for user:', userID);
                ws.send(JSON.stringify({ success: false, data: 'inventory not found', requestID }));
                return;
            }
            //récupère l'item du slot et le supprime de l'inventaire et de la base de donnée des items
            let item = inventory[slot];
            if (!item) {
                log.e('no item in slot:', slot);
                ws.send(JSON.stringify({ success: false, data: 'no item in slot', requestID }));
                return;
            }
            itemDB.findOne({ where: { id: item } }).then(async (item) => {
                //si le nombre d'item à supprimer est supérieur au nombre d'item dans le slot, on supprime tout
                if (quantity >= item.quantity) {
                    quantity = item.quantity;
                }
                item.quantity -= quantity;
                if (item.quantity > 0) {
                    item.save();
                } else {
                    item.destroy();
                    inventory[slot] = null;
                    inventory.save();
                }
                        
                log.s('item dropped from', slot);
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
                log.e('error finding item:', err);
                ws.send(JSON.stringify({ success: false, data: 'error finding item', requestID }));
            });
        }).catch((err) => {
            log.e('error finding inventory:', err);
            ws.send(JSON.stringify({ success: false, data: 'error finding inventory' ,requestID  }));
        });
    }).catch((err) => {
        log.e('error finding user:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding user',requestID  }));
    });
}
