const help = require('../utils/help')
const Datastore = require('nedb');

class Setting {
    constructor() {
        const dataPath = help.getDataPath() + '/data/setting.db';
        console.log(dataPath);
        this.db = new Datastore({filename: dataPath, autoload: true});
    }

    setWin(data) {
        const that = this;
        data['_id'] = 'win';
        return new Promise((resolve) => {
            that.db.findOne({_id: data['_id']}, function (err, doc) {
                if (doc == null) {
                    that.db.insert(data, function (err) {
                        resolve();
                    });
                } else {
                    that.db.update({_id: data['_id']}, {$set: data}, {}, function (err) {
                        resolve();
                    });
                }
            });
        });
    }

    getWin() {
        const that = this;
        return new Promise((resolve) => {
            that.db.findOne({_id: 'win'}, function (err, doc) {
                resolve(doc);
            });
        });
    }
}

module.exports = new Setting();
