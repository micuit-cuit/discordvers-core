module.exports = function (ws,userID) {
    ws.init();
    ws.send(JSON.stringify({
        route: '/user/create',
        requestID: 1,
        user: userID,
        data: {
            userID: userID
        }
    }))
    ws.onse(1, (data) => {
        if (!data.success) console.error(data, "User not created")
        else console.log("User created")
        //demande de l'inventaire
        ws.send(JSON.stringify({
            route: '/user/inventory/get',
            requestID: 2,
            user: userID,
            data: {
                userID: userID
            }
        }))
        ws.onse(2, (data) => {
            if (!data.success){ console.error(data, "Inventory not received")}
            else {
                //affichez l'inventaire de l'utilisateur sous forme de tableau 5x4
                console.log("Inventory received")
                const inventory = data.data;
                displayInventory(inventory);
                
            }
            
            //demande de l'utilisateur
            ws.send(JSON.stringify({
                route: '/user/get',
                requestID: 3,
                user: userID,
                data: {
                    userID: userID
                }
            }))
            ws.onse(3, (data) => {
                if (!data.success) console.error(data, "User not received")
                else console.log("User received")
                //deplacement d'un item du slot20 au slot1
                ws.send(JSON.stringify({
                    route: '/user/inventory/move',
                    requestID: 4,
                    user: userID,
                    data: {
                        userID: userID,
                        slotFrom: 'slot20',
                        slotTo: 'slot1'
                    }
                }))
                ws.onse(4, (data) => {
                    if (!data.success) console.error(data, "Inventory not moved")
                    else {
                        console.log("Inventory moved")
                        const inventory = data.data;
                        displayInventory(inventory);
                        ws.sendAndAwait({
                            route: '/user/inventory/drop',
                            requestID: 1,
                            user: userID,
                            data: {
                                userID: userID,
                                slot: 'slot1',
                                quantity: 1
                            }
                        }, (data) => {
                            if (!data.success) console.error(data, "Item not dropped")
                            else {
                                console.log("Item dropped")
                                const inventory = data.data;
                                displayInventory(inventory);
                            }
                            ws.sendAndAwait({
                                route: '/user/inventory/split',
                                requestID: 2,
                                user: userID,
                                data: {
                                    userID: userID,
                                    slotFrom: 'slot1',
                                    slotTo: 'slot2',
                                    quantity: 2
                                }
                            }, (data) => {
                                if (!data.success) console.error(data, "Item not splitted")
                                else {
                                    console.log("Item splitted")
                                    const inventory = data.data;
                                    displayInventory(inventory);
                                    ws.sendAndAwait({
                                        route: '/user/inventory/move',
                                        requestID: 3,
                                        user: userID,
                                        data: {
                                            userID: userID,
                                            slotFrom: 'slot20',
                                            slotTo: 'slot10'
                                        }
                                    }, (data) => {
                                        if (!data.success) console.error(data, "Inventory not moved")
                                        else {
                                            console.log("Inventory moved")
                                            const inventory = data.data;
                                            displayInventory(inventory);
                                        }
                                        ws.close();

                                    })
                                }
                            })
                        })
                        //affichez l'inventaire de l'utilisateur sous forme de tableau 5x4
                        
                    }
                })
            })
        })
 
    })


}


function displayInventory(inventory) {
    const slots = Object.keys(inventory).filter(key => key.startsWith('slot'));
    for (let i = 0; i < slots.length; i += 5) {
        console.log(slots.slice(i, i + 5).map(slot => {
            if (inventory[slot]) return inventory[slot].key+" "+inventory[slot].quantity;
            else return "empty";
        }))
    }
}