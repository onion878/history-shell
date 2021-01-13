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
        const data = {input: input, name: name, created: help.getNow(), group: input.split(/(\s+)/)[0]};
        return new Promise((resolve) => {
            that.db.findOne({input: data['input']}, function (err, doc) {
                that.db.remove({input: data['input'], name: name}, {multi: true}, function (err, numRemoved) {
                    that.db.insert(data, function (err) {
                        resolve();
                    });
                });
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
                resolve(doc);
            });
        });
    }


}

module.exports = new HistoryData();
