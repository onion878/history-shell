declare function require(arg: string);
const { dialog, getCurrentWindow } = require('electron').remote;

export function showError(msg: string) {
    return dialog.showMessageBox(
        getCurrentWindow(),
        {
            title: '错误提示',
            message: msg,
            type: 'error',
        });
}

export function showConfirm(msg: string) {
    return dialog.showMessageBox(getCurrentWindow(), {
        type: 'question',
        buttons: ['否', '是'],
        title: '提示',
        defaultId: 1,
        message: msg,
        noLink: true
    });
}