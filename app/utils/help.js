let appData = null, appPath = null;
const path = require('path');
const app = require('app-root-path');

module.exports = {
    getDataPath() {
        if (appData == null) {
            appData = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) + '/history-shell';
        }
        if (appPath == null) {
            appPath = app.path + "";
        }
        return appData;
    },
    getAppPath() {
        if (path.basename(appPath) == 'app.asar') {
            return path.dirname(appPath).replace(/\\/g, '/');
        }
        return appPath.replace(/\\/g, '/');
    },
    toJSON(data) {
        const v = {};
        data.forEach(d => {
            v[d.id] = d;
        });
        return v;
    },
    isEmpty(val) {
        if (val !== undefined && val != null && (val + '').trim() !== '') return false; else return true;
    },
    getUUID() {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
        return uuid;
    },
    getNow() {
        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hours = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();

        let code = date.getFullYear() + '-' + toForMatter(month) + '-' +
            toForMatter(day) + ' ' + toForMatter(hours) + ':' + toForMatter(min)
            + ':' + toForMatter(sec);

        function toForMatter(num) {
            if (num < 10) {
                num = "0" + num;
            }
            return num + "";
        }

        return code;
    }
};
