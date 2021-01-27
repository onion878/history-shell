const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = {
    getData: function (parent) {
        return new Promise((resolve, reject) => {
            const roots = [];
            if (parent) {
                const files = fs.readdirSync(parent);
                files.forEach(file => {
                    const p = path.resolve(parent, file);
                    try {
                        if (fs.lstatSync(p).isDirectory()) {
                            roots.push({
                                "id": p,
                                "path": p, "type": "folder", "name": file,
                                "icon": "./assets/image/folder.svg",
                                "children": []
                            });
                        } else {
                            roots.push({
                                "id": p,
                                "path": p,
                                "type": "file",
                                "name": file,
                                "icon": "./assets/image/file.svg"
                            });
                        }
                    } catch (e) {
                        roots.push({
                            "id": p,
                            "path": p,
                            "type": "file",
                            "name": file,
                            "authority": false,
                            "icon": "./assets/image/file.svg"
                        });
                    }
                });
                resolve(roots);
            } else {
                if (os.platform() == 'win32') {
                    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                    const list = c.split("");
                    for (let i = 0; i < list.length; i++) {
                        const p = list[i] + ':\\';
                        const flag = fs.existsSync(p);
                        if (flag) {
                            roots.push({
                                "id": p,
                                "path": p.replace("/\\/g", "/"),
                                "type": "folder",
                                "name": list[i],
                                "icon": "./assets/image/folder.svg",
                                "children": []
                            });
                        }
                    }
                } else {
                    roots.push({
                        "id": "/",
                        "path": "/",
                        "type": "folder",
                        "name": "root",
                        "icon": "./assets/image/folder.svg",
                        "children": []
                    });
                }
                resolve(roots);
            }
        });
    },
}
