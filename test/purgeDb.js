const fs = require('fs');
module.exports = function (ws,userID) {
    //suprimmer la db
    const patch ="../db/database.sqlite";
    if (fs.existsSync(patch)) {
        fs.unlinkSync(patch);
    }
    ws.close();
}