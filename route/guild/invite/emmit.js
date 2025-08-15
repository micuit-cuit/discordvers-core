const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'yellow', text: 'invite' }, { style: 'circle', color: 'blue', text: 'emmitGuild' }]);
const snowflake = require('../../../lib/snowflake');
const guildRole = require('../../../lib/guildRole');

/* 
    @route: /guild/invite/emmit
    @name: emmitGuild
    @description: Send an invitation to a user to join the guild
    @param: discordServerID , discordUserID (user sending the invitation), discordUserID (user receiving the invitation, optional), useNumber (number of use of the invitation, optional)
    @return: JSON Object {success, data: invitationToken}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const guildDB = db.models.guild;
    const userDB = db.models.user;
    const inviteDB = db.models.invite;
    const discordServerID = args.discordServerID;
    const discordUserID = args.discordUserID;
    const discordUserID2 = args.discordUserIDTo || -1;
    const useNumber = args.useNumber? args.useNumber > 0? args.useNumber : -1 : 1;
    //check if guild already exist
    guildDB.findOne({ where: { id: discordServerID } }).then((guild) => {
        if (guild) {
            //check if user already exist
            userDB.findOne({ where: { id: discordUserID } }).then((user) => {
                if (user) {
                    //check if user already exist
                    if (discordUserID2 == -1) {
                        //create an invitation for the guild and not dedicated to a user
                        const invitationToken = snowflake("invitationGuild").str
                        //create an invitation
                        inviteDB.create({ id: invitationToken, guild: guild.id, user: user.id,user2:null, useNumber }).then((invite) => {
                            ws.send(JSON.stringify({ success: true, data: invitationToken, requestID }));
                        }).catch((err) => {
                            log.e('error creating invitation:', err);
                            ws.send(JSON.stringify({ success: false, data: 'error creating invitation', requestID }));
                        });
                        return;
                    }
                    userDB.findOne({ where: { id: discordUserID2 } }).then((user2) => {
                        if (user2) {
                            //check if the user is in the guild and as a role owner or admin
                            guildRole.testUserPermission(userDB, guildDB, user.id, "INVITE_MEMBERS")
                            .then((result) => {
                                if (!result.data.userAllowed) {
                                    ws.send(JSON.stringify({ success: false, data: 'you are not allowed to invite a user', requestID }));
                                    return;
                                } 
                                //verify if the user is in the guild
                                if (user2.guild == guild.id) {
                                    ws.send(JSON.stringify({ success: false, data: 'user already in the guild', requestID }));
                                    return;
                                }
                                //create an invitation
                                const invitationToken = snowflake("invitationGuild").str;
                                inviteDB.create({ id: invitationToken, guild: guild.id, user: user.id, user2: user2.id, useNumber }).then((invite) => {
                                    ws.send(JSON.stringify({ success: true, data: invitationToken, requestID }));
                                }).catch((err) => {
                                    log.e('error creating invitation:', err);
                                    ws.send(JSON.stringify({ success: false, data: 'error creating invitation', requestID }));
                                });
                            }).catch((err) => {
                                log.e('error testing user permission:', err);
                                ws.send(JSON.stringify({ success: false, data: 'error testing user permission, message:'+err.data, requestID }));
                            })
                        }else {
                            ws.send(JSON.stringify({ success: false, data: 'user not found', requestID }));
                        }
                    }).catch((err) => {
                        log.e('error finding user:', err);
                        ws.send(JSON.stringify({ success: false, data: 'error finding user', requestID }));
                    })
                } else {
                    ws.send(JSON.stringify({ success: false, data: 'user not found', requestID }));
                }
            }).catch((err) => {
                log.e('error finding user:', err);
                ws.send(JSON.stringify({ success: false, data: 'error finding user', requestID }));
            })
        } else {
            ws.send(JSON.stringify({ success: false, data: 'guild not found', requestID }));
        }
    }).catch((err) => {
        log.e('error finding guild:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding guild', requestID }));
    });
}
