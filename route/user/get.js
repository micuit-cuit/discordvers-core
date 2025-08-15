const snowflake = require('../../lib/snowflake');
const LOG = require('mi-log');
const log = new LOG([{ style: 'square', color: 'red', text: 'discrod-vers-core' }, { style: 'circle', color: '#ff00ff', text: 'user' }, { style: 'circle', color: 'blue', text: 'getUser' }]);
/* 
    @route: /user/get
    @name: getUser
    @description: Get a user from the database
    @param: discordUserID
    @return: JSON Object {success, data: user}
*/
log.s('module Loaded');
module.exports = function (db, ws, userID, inputData, requestID) {
    log.i(`the user ${userID} is trying to get ${inputData.userID}`);
    const userDB = db.models.user;
    //check if user already exist
    userDB.findOne({ where: { id: inputData.userID.toString() } }).then((user) => {
        if (user) {
            ws.send(JSON.stringify({ success: true, data: user ,requestID }));
        } else {
            ws.send(JSON.stringify({ success: false, data: 'user not found',requestID }));
        }
    }).catch((err) => {
        log.e('error finding user:', err);
        ws.send(JSON.stringify({ success: false, data: 'error finding user' },requestID));
    });
}
