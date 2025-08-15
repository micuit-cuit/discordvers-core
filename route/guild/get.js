const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'guild' }, { style: 'circle', color: 'blue', text: 'getGuild' }]);
/* 
    @route: /guild/get
    @name: getGuild
    @description: Get the guild by the discordServerID
    @param: discordServerID
    @return: JSON Object {success, data: guild}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, args, requestID) {
    const guildDB = db.models.guild;
    const discordServerID = args.discordServerID;
    //check if guild already exist
    guildDB.findOne({ where: { id: discordServerID } }).then((guild) => {
        if (guild) {
            ws.send(JSON.stringify({ success: true, data: guild, requestID }));
        } else {
            ws.send(JSON.stringify({ success: false, data: 'guild not found', requestID }));
        }
    })
}
