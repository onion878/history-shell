declare const process: any;

declare function require(arg: string);

const {shell} = require('electron');
const fs = require('fs');
const Path = require('path');
const winReg = new RegExp(/^([a-z]:((\\|\/|\\\\|\/\/))|(\\\\|\/\/))[^<>:"|?*]+/i);
const linuxReg = new RegExp(/^([\\/][a-z0-9\s\-_\@\-\^!#$%&]*)+(\.[a-z][a-z0-9]+)?$/i);

export function isEmpty(val) {
    if (val !== undefined && val != null && (val + '').trim() !== '') return false; else return true;
}

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

const allTerminal = {};

export function addTerminal(id, terminal) {
    allTerminal[id] = terminal;
}

export function writeTerminal(id, shell) {
    allTerminal[id].key = {key: 'write'};
    allTerminal[id].writeToServer(shell);
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
