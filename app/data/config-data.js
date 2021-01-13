const help = require('../utils/help')
const Datastore = require('nedb');
const fs = require('fs');

class ConfigData {
    constructor() {
        const dataPath = help.getDataPath() + '/data/config.db';
        console.log(dataPath);
        this.db = new Datastore({filename: dataPath, autoload: true});
    }

    insert(id, data) {
        const that = this;
        if (id == null) {
            id = help.getUUID();
        }
        data['_id'] = id;
        return new Promise((resolve) => {
            that.db.findOne({_id: id}, function (err, doc) {
                if (doc == null) {
                    that.db.insert(data, function (err) {
                        resolve();
                    });
                } else {
                    that.db.update({_id: id}, {$set: data}, {}, function (err) {
                        resolve();
                    });
                }
            });
        });
    }

    deleteByIdList(ids) {
        const that = this;
        return new Promise((resolve) => {
            let i = 0;
            ids.forEach(id => {
                that.db.remove({_id: id}, {multi: true}, function (err, numRemoved) {
                    i++;
                    if (i == ids.length) {
                        resolve();
                    }
                });
            })
        });
    }

    getLocalTerminal() {
        const folder = [];
        const git = 'C:/Program Files/Git/bin/bash.exe';
        if (fs.existsSync(git)) {
            folder.push({
                type: "file",
                key: "terminal",
                name: "git",
                id: 'git',
                path: 'C:/Program Files/Git/bin/bash.exe',
                icon: "./assets/image/git.svg",
            });
        }
        const wsl = 'C:/Windows/System32/wsl.exe';
        if (fs.existsSync(wsl)) {
            folder.push({
                type: "file",
                key: "terminal",
                name: "git",
                id: 'git',
                path: 'C:/Windows/System32/wsl.exe',
                icon: "./assets/image/git.svg",
            });
        }
        return [
            {
                type: "folder",
                key: "terminal",
                name: "本地终端",
                expanded: false,
                icon: "./assets/image/local.svg",
                children: [
                    {
                        type: "file",
                        key: "terminal",
                        name: "cmd",
                        id: 'cmd',
                        icon: "./assets/image/terminal.svg",
                    },
                    ...folder,
                ]
            }
        ];
    }

    getAllData() {
        const that = this;
        return new Promise((resolve) => {
            that.db.find({}, function (err, doc) {
                let data = [];
                if (doc) {
                    doc.forEach(d => {
                        d.id = d._id;
                        d.icon = "./assets/image/ssh.svg";
                        if (d.type == 'folder') {
                            d.icon = "./assets/image/folder.svg";
                            d.expanded = false;
                        }
                    });
                    data = that.compileTreeData(doc);
                }
                data = that.getLocalTerminal().concat(data);
                resolve(data);
            });
        });
    }

    compileTreeData(list) {
        let map = {}, node, roots = [], i;
        for (i = 0; i < list.length; i += 1) {
            map[list[i].id] = i; // initialize the map
            list[i].children = []; // initialize the children
        }
        for (i = 0; i < list.length; i += 1) {
            node = list[i];
            if (node.parentId) {
                // if you have dangling branches check that map[node.parentId] exists
                list[map[node.parentId]].children.push(node);
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

}

module.exports = new ConfigData();
