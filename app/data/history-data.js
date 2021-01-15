const help = require('../utils/help')
const Datastore = require('nedb');

class HistoryData {
    constructor() {
        const dataPath = help.getDataPath() + '/data/history.db';
        console.log(dataPath);
        this.db = new Datastore({filename: dataPath, autoload: true});
    }

    insert(input, name) {
        const that = this;
        const data = {
            input: input,
            name: name,
            created: help.getNow(),
            group: input.split(/(\s+)/)[0],
            uniqueId: input.replace(/\s+/g, "")
        };
        return new Promise((resolve) => {
            that.db.findOne({uniqueId: data['uniqueId']}, function (err, doc) {
                if (doc == null) {
                    data.sort = new Date().getTime();
                    that.db.insert(data, function (err) {
                        resolve();
                    });
                } else {
                    doc.sort = new Date().getTime();
                    that.db.update({_id: doc._id}, {$set: doc}, {}, function (err) {
                        resolve();
                    });
                }
            });
        });
    }

    delete(id) {
        const that = this;
        return new Promise((resolve) => {
            that.db.remove({_id: id}, {multi: true}, function (err, numRemoved) {
                resolve();
            });
        });
    }


    getAllData(name) {
        const that = this;
        return new Promise((resolve) => {
            that.db.find({name: name}, function (err, doc) {
                resolve(doc.sort((a, b) => (a.sort < b.sort) ? 1 : ((b.sort < a.sort) ? -1 : 0)));
            });
        });
    }


}

module.exports = new HistoryData();
