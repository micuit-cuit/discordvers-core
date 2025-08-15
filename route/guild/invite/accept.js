const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'yellow', text: 'invite' }, { style: 'circle', color: 'blue', text: 'acceptGuild' }]);
const guildRole = require('../../../lib/guildRole');

/* 
    @route: /guild/invite/accept
    @name: acceptGuild
    @description: Send an invitation to a user to join the guild
    @param: discordUserID, invitationToken
    @return: JSON Object {success, data: guild}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const guildDB = db.models.guild;
    const userDB = db.models.user;
    const inviteDB = db.models.invite;
    const discordUserID = args.discordUserID;
    const invitationToken = args.invitationToken;
    //check if user already exist
    userDB.findOne({ where: { id: discordUserID } }).then((user) => {
        if (user) {
            //check if invitation already exist
            inviteDB.findOne({ where: { id: invitationToken } }).then((invite) => {
                if (invite) {
                    //check if the user is the one who received the invitation
                    if (invite.user2 == user.id || invite.user2 == null){
                        if (invite.useNumber == 0) {
                            ws.send(JSON.stringify({ success: false, data: 'invitation already used', requestID }));
                            return;
                        }
                        if (invite.guild == user.guild) {
                            ws.send(JSON.stringify({ success: false, data: 'user already in the guild', requestID }));
                            return;
                        }
                        if (user.guild) {
                            ws.send(JSON.stringify({ success: false, data: 'user already in a guild', requestID }));
                            return;
                        }
                        //check if guild already exist
                        guildDB.findOne({ where: { id: invite.guild } }).then((guild) => {
                            if (guild) {
                                //update the user guild
                                user.update({ guild: guild.id }).then(() => {
                                    //update the guild member
                                    const members = guild.members;
                                    members[user.id] = { role: 'member' };
                                    guildRole.addUserRole(userDB, guildDB, user.id, 4).then(() => {
                                        //update the invitation
                                        if (invite.useNumber != -1) {
                                            const useNumber = invite.useNumber - 1;
                                            if (useNumber == 0) {
                                                invite.destroy().then(() => {
                                                    ws.send(JSON.stringify({ success: true, data: guild, requestID }));
                                                }).catch((err) => {
                                                    log.e('error deleting invitation:', err);
                                                    ws.send(JSON.stringify({ success: false, data: 'error deleting invitation', requestID }));
                                                });
                                            }else {
                                                invite.update({useNumber}).then(() => {
                                                    ws.send(JSON.stringify({ success: true, data: guild, requestID }));
                                                }).catch((err) => {
                                                    log.e('error updating invitation:', err);
                                                    ws.send(JSON.stringify({ success: false, data: 'error updating invitation', requestID }));
                                                });
                                            }
                                        }else {
                                            ws.send(JSON.stringify({ success: true, data: guild, requestID }));
                                        }
                                    }).catch((err) => {
                                        log.e('error updating guild:', err);
                                        ws.send(JSON.stringify({ success: false, data: 'error updating guild', requestID }));
                                    });
                                }).catch((err) => {
                                    log.e('error updating user:', err);
                                    ws.send(JSON.stringify({ success: false, data: 'error updating user', requestID }));
                                });
                            }else {
                                ws.send(JSON.stringify({ success: false, data: 'guild not found', requestID }));
                            }
                        }).catch((err) => {
                            log.e('error finding guild:', err);
                            ws.send(JSON.stringify({ success: false, data: 'error finding guild', requestID }));
                        });
                    }else {
                        ws.send(JSON.stringify({ success: false, data: 'invitation not for this user', requestID }));
                    }
                }
            }).catch((err) => {
                log.e('error finding invitation:', err);
                ws.send(JSON.stringify({ success: false, data: 'error finding invitation', requestID }));
            });
        }else {
            ws.send(JSON.stringify({ success: false, data: 'user not found', requestID }));
        }
    }).catch((err) => {
        log.e('error finding user:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding user', requestID }));
    });
}
