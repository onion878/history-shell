declare const process: any;

declare function require(arg: string);

const {shell} = require('electron');
const fs = require('fs');
const Path = require('path');
const winReg = new RegExp(/^([a-z]:((\\|\/|\\\\|\/\/))|(\\\\|\/\/))[^<>:"|?*]+/i);
const linuxReg = new RegExp(/^([\\/][a-z0-9\s\-_\@\-\^!#$%&]*)+(\.[a-z][a-z0-9]+)?$/i);

let _init = false;

export function initSuccess() {
    _init = true;
}

export function isInit() {
    return _init;
}

export function isEmpty(val) {
    if (val !== undefined && val != null && (val + '').trim() !== '') return false; else return true;
}

export const formatDuring = (t) => {
    const HOUR = 1000 * 60 * 60;
    const d = parseInt((t / (HOUR * 24)).toString());
    const h = parseInt(((t % (HOUR * 24)) / (HOUR)).toString());
    const m = parseInt(((t % (HOUR)) / (1000 * 60)).toString());
    const s = parseInt(((t % (1000 * 60)) / 1000).toString());

    let text = '';
    d && (text += `${d}天`);
    h && (text += `${h}小时`);
    m && (text += `${m}分`);
    s && (text += `${s}秒`);
    return text || '-';
};


export function validateData(data, ignore) {
    let index = 0;
    for (let k in data) {
        if (!(ignore && ignore[k])) {
            if (isEmpty(data[k])) {
                index++;
            }
        }
    }
    return index == 0;
}

let nowTerminalId = null;

const allTerminal = {};

export function addTerminal(id, terminal) {
    allTerminal[id] = terminal;
}

export function writeTerminal(id, shell) {
    allTerminal[id].key = {key: 'write'};
    allTerminal[id].writeToServer(shell);
}

export function setNowTerminal(id) {
    nowTerminalId = id;
}

export function getNowTerminal() {
    return allTerminal[nowTerminalId];
}

export function changeAllTheme(index) {
    let t;
    for (const id in allTerminal) {
        t = allTerminal[id].changeTheme(index);
    }
    return t;
}

export function closeTerminal(id) {
    allTerminal[id].destroy();
}

export function isWin() {
    return process.platform == 'win32';
}

export function isDarwin() {
    return process.platform === 'darwin';
}

export function matchLocalPath(path: string) {
    if (!fs.existsSync(Path.resolve(path))) {
        return false;
    }
    if (process.platform == 'win32') {
        return winReg.test(path);
    } else {
        return linuxReg.test(path);
    }
}

export function matchSSHPath(path: string) {
    return linuxReg.test(path);
}

export function isFile(path: string) {
    try {
        const stat = fs.lstatSync(path);
        return stat.isFile();
    } catch (e) {
        return false;
    }
}

export function openFolder(path: string) {
    shell.showItemInFolder(Path.resolve(path));
}

export function openFile(path: string) {
    shell.openPath(Path.resolve(path));
}

export function getFileInfo(path: string) {
    return fs.lstatSync(path);
}

export function getNow(date: Date = new Date()) {
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

export function getNowTime(date: Date = new Date()) {
    let hours = date.getHours();
    let min = date.getMinutes();
    let sec = date.getSeconds();

    let code = toForMatter(hours) + ':' + toForMatter(min) + ':' + toForMatter(sec);

    function toForMatter(num) {
        if (num < 10) {
            num = "0" + num;
        }
        return num + "";
    }

    return code;
}

export function bytesToSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
