const Client = require('ssh2').Client;

class Sftp {
    constructor() {
        this.sftp = null;
    }

    init(config) {
        const conn = new Client(), that = this;
        return new Promise((resolve, reject) => {
            conn.on('ready', function () {
                console.log('Sftp :: ready');
                conn.sftp(function (err, sftp) {
                    if (err) throw err;
                    that.sftp = sftp;
                    resolve(that.sftp);
                });
            }).connect({
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
            });
        });
    }

    getData(parent) {
        const that = this;
        return new Promise(resolve => {
            if (that.sftp == null) {
                resolve([]);
                return;
            }
            that.sftp.readdir(parent ? parent : '/', function (err, list) {
                if (err) throw err;
                const roots = [];
                list.forEach(l => {
                    const p = (parent ? parent + '/' : '/') + l.filename;
                    if (l.attrs.isDirectory()) {
                        roots.push({
                            id: p,
                            path: p,
                            type: "folder",
                            name: l.filename,
                            icon: "./assets/image/folder.svg",
                            children: []
                        });
                    } else {
                        roots.push({
                            id: p,
                            path: p,
                            type: "file",
                            name: l.filename,
                            icon: "./assets/image/file.svg"
                        });
                    }
                });
                resolve(roots);
            });
        })
    }

}

module.exports = Sftp;