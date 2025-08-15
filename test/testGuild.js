module.exports = function (ws,userID) {
    ws.init();
    ws.send(JSON.stringify({
        route: '/guild/create',
        requestID: 1,
        user: userID,
        data: {
            userID: userID,
            guildName: "1332329400359714839",
            discordServerID: "1332329400359714839"
        }
    }))
    ws.onse(1, (data) => {
        if (!data.success) console.error(data, "Guild not created")
        else console.log("Guild created")
        //demande de l'inventaire
        ws.send(JSON.stringify({
            route: '/guild/get',
            requestID: 2,
            user: userID,
            data: {
                discordServerID: "1332329400359714839",
                discordUserID: 1
            }
        }))
        ws.onse(2, (data) => {
            if (!data.success) console.error(data, "Guild not received")
            else console.log(data, "Guild received")
            //crée une invitation
            ws.send(JSON.stringify({
                route: '/guild/invite/emmit',
                requestID: 3,
                user: userID,
                data: {
                    discordServerID: "1332329400359714839",
                    discordUserID: 1,
                    discordUserIDTo: 3,
                    useNumber: 10
                }
            }))
            ws.onse(3, (data) => {
                if (!data.success){
                    console.error(data, "Invitation not created")
                    ws.close();
                }else console.log(data, "Invitation created")
                //accepte l'invitation
                ws.send(JSON.stringify({
                    route: '/guild/invite/accept',
                    requestID: 4,
                    user: userID,
                    data: {
                        discordUserID: 3,
                        invitationToken: data.data
                    }
                }))
                ws.onse(4, (data) => {
                    if (!data.success) console.error(data, "Invitation not accepted")
                    else console.log(data, "Invitation accepted")
                    //demande de l'utilisateur
                    ws.close();
                })
            
            })
        })
  
    })
}