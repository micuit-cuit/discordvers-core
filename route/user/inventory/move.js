const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'user' }, { style: 'circle', color: 'yellow', text: 'inventory' }, { style: 'circle', color: 'blue', text: 'moveInventory' }]);
/* 
    @route: /user/inventory/move
    @name: moveInventory
    @description: Move an item from a slot to another
    @param: discordUserID, slotFrom, slotTo
    @return: JSON Object {success, data: inventory}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const userDB = db.models.user;
    const inventoryDB = db.models.inventory;
    const itemDB = db.models.item;
    const { slotFrom, slotTo } = args;
    if (!slotFrom || !slotTo) {
        log.e('missing slotFrom or slotTo');
        ws.send(JSON.stringify({ success: false, data: 'missing slotFrom or slotTo', requestID }));
        return;
    }
    if (!(slotFrom.startsWith('slot') && slotTo.startsWith('slot'))) {
        log.e('slotFrom or slotTo is not a slot');
        ws.send(JSON.stringify({ success: false, data: 'slotFrom or slotTo is not a slot', requestID }));
        return;
    }
    //test si les slots sont bien des slots entre 1 et 20
    if (slotFrom.replace('slot', '') < 1 || slotFrom.replace('slot', '') > 20 || slotTo.replace('slot', '') < 1 || slotTo.replace('slot', '') > 20) {
        log.e('slotFrom or slotTo is not between 1 and 20');
        ws.send(JSON.stringify({ success: false, data: 'slotFrom or slotTo is not between 1 and 20', requestID }));
        return
    }
    log.d('moving item from', slotFrom, 'to', slotTo);
    //check if user already exist
    userDB.findOne({ where: { id: userID } }).then((user) => {
        //récupère l'inventaire de l'utilisateur
        inventoryDB.findOne({ where: { id: user.inventory } }).then(async (inventory) => {            //pour chaque slot de l'inventaire, récupère l'item correspondant (les 20 slots en même temps)
            if (!inventory) {
                log.e('inventory not found for user:', userID);
                ws.send(JSON.stringify({ success: false, data: 'inventory not found', requestID }));
                return;
            }
            //inverce les slots
            const itemFromID = inventory[slotFrom];
            const itemToID = inventory[slotTo];
            //si les slote contiennent les mêmes items, on fusionne les quantités sur le slotTo
            const itemFrom = await itemDB.findOne({ where: { id: itemFromID } });
            const itemTo = await itemDB.findOne({ where: { id: itemToID } });
            if (itemTo) {
                if (itemFrom.key === itemTo.key && itemFrom.price === itemTo.price) {
                    itemTo.quantity += itemFrom.quantity;
                    itemFrom.destroy();
                    itemTo.save();
                    inventory[slotFrom] = null;
                    inventory.save().then(async () => {
                        inventoryBuilder({inventory, itemDB, ws, requestID, slotFrom, slotTo});
                    }).catch((err) => {
                        log.e('error moving item:', err);
                        ws.send(JSON.stringify({ success: false, data: 'error moving item', requestID }));
                    });
                    return;
                }
            }
            inventory[slotFrom] = itemToID;
            inventory[slotTo] = itemFromID;
            //sauvegarde l'inventaire
            inventory.save().then(async () => {
                inventoryBuilder({inventory, itemDB, ws, requestID, slotFrom, slotTo});
            }).catch((err) => {
                log.e('error moving item:', err);
                ws.send(JSON.stringify({ success: false, data: 'error moving item', requestID }));
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


async function inventoryBuilder({inventory, itemDB, ws, requestID, slotFrom, slotTo}) {
    log.s('item moved from', slotFrom, 'to', slotTo);
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
}