const c = require('ansi-colors');
const SearchAddon = require('xterm-addon-search').SearchAddon;
const SearchAddonBar = require('xterm-addon-search-bar').SearchBarAddon;
const Unicode11Addon = require('xterm-addon-unicode11').Unicode11Addon;
const WebLinksAddon = require('xterm-addon-web-links').WebLinksAddon;
const themes = require('../../assets/config/windows-terminal-themes.json');
const historyData = require('../data/history-data');
const {dialog, getCurrentWindow} = require('electron').remote;

class BaseService {

    constructor() {
        this.name = null;
        this.term = null;
        this.searchBar = null;
        this.isWrite = true;
        this.options = null;
        this.key = null;
        this.initFlag = false;
        this.getTermOptions();
        this.history = "";
        this.oldRow = 0;
        this.recordFlag = true;
        c.theme({
            danger: c.red,
            dark: c.dim.gray,
            disabled: c.gray,
            em: c.italic,
            heading: c.bold.underline,
            info: c.cyan,
            muted: c.dim,
            primary: c.blue,
            strong: c.bold,
            success: c.green,
            underline: c.underline,
            warning: c.yellow
        });
        this.colors = [
            {regex: /info/i, color: c.info},
            {regex: /Error/i, color: c.danger},
            {regex: /Version/i, color: c.info},
            {regex: /Warning/i, color: c.warning},
            {regex: /Permission denied/i, color: c.danger},
            {regex: /([0-9]{1,3}.){3}\.([0-9]{1,3})/g, color: c.info},
            {regex: /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+(\:~#)/g, color: c.success.strong},
            {
                regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
                color: c.primary.underline
            }
        ];
    }

    changeTheme(index) {
        const theme = themes[index];
        const d = {
            cursor: theme.brightBlack,
            selection: theme.brightWhite,
            ...theme
        };
        this.term?.setOption('theme', d);
        return d;
    }

    getTermOptions() {
        const that = this;
        if (that.options == null) {
            // Initialize xterm.js and attach it to the DOM
            let font = '"Cascadia Code","Fira Mono","IBM Plex Mono","Menlo",Consolas,monospace,monospace',
                fontSize = 14;
            const theme = themes[21];
            that.options = {
                fontSize: fontSize,
                fontFamily: font,
                theme: {
                    cursor: theme.brightBlack,
                    selection: theme.brightWhite,
                    ...theme
                }
            };
        }
        return that.options;
    }

    initXtermSuccess() {
        const that = this;
        const searchAddon = new SearchAddon();
        that.searchBar = new SearchAddonBar({
            searchAddon
        });
        that.term.loadAddon(searchAddon);
        that.term.loadAddon(that.searchBar);
        const unicode11Addon = new Unicode11Addon();
        that.term.loadAddon(unicode11Addon);
        that.term.unicode.activeVersion = '11';
        that.term.loadAddon(new WebLinksAddon((event, uri) => {
            if (event.type == 'click') {
                require("open")(uri);
            }
        }));
        this.term.onKey(({domEvent}) => {
            that.key = domEvent;
            if (domEvent.ctrlKey) {
                switch (domEvent.key) {
                    case "f": {
                        this.isWrite = false;
                        that.searchBar?.show();
                        break;
                    }
                    case "c": {
                        if (that.term.getSelection().length > 0) {
                            this.isWrite = false;
                            document.execCommand('copy');
                        }
                        break;
                    }
                    case "v": {
                        this.isWrite = false;
                        this.copyToXterm();
                        break;
                    }
                    default:
                        this.isWrite = true;
                }
            } else {
                this.isWrite = true;
            }
            switch (domEvent.key) {
                case "Escape": {
                    that.searchBar?.hidden();
                    break;
                }
                case "Backspace": {
                    break;
                }
                case "Enter": {
                    that.recordHistory(true);
                    this.recordFlag = true;
                    break;
                }
                default:
            }
        });
    }

    copyToXterm() {
        const that = this;
        navigator.clipboard.readText().then(r => {
            that.isWrite = true;
            that.writeToServer(r);
        });
    }

    writeToServer(r) {
        const that = this;
        that.recordFlag = true;
        this.recordHistory(false);
        if (r.length > 0) {
            if (r.split(' \\\n ').length == r.split('\n').length) {
                that.key = {key: 'copy'};
                if (r.indexOf('\r') > -1) {
                    const s = r.split('\r');
                    s.forEach(l => {
                        if (l.trim().length > 0) {
                            historyData.insert(l.split('\n>').join(''), that.name).then();
                        }
                    })
                }
                that.write(r);
                this.runAfter();
            } else {
                that.showConfirm("您复制了多行会直接执行的代码,将在按回车前不会记录该历史,是否继续").then(({response}) => {
                    if (response === 1) {
                        that.recordFlag = false;
                        that.write(r);
                        this.runAfter();
                    }
                });
            }
        }
    }

    showConfirm(msg) {
        return dialog.showMessageBox(getCurrentWindow(), {
            type: 'question',
            buttons: ['否', '是'],
            title: '提示',
            defaultId: 1,
            message: msg,
            noLink: true
        });
    }

    writeToXterm(shell) {
        const that = this;
        this.term?.write(this.changeColor(shell), function () {
            if (that.key == null || that.key.key == 'Enter') {
                that.recordHistory(false);
            }
        });
    }

    recordHistory(flag) {
        if (this.recordFlag === false) return;
        if (flag) {
            this.runAfter();
            this.key = null;
            if (this.history.trim().length == 0) return;
            const row = this.term.buffer.active.baseY + this.term.rows;
            this.term.selectLines(this.oldRow, row);
            const end = this.term.getSelection().trim();
            const h = end.substring(this.history.length).trim();
            if (h.length > 0) {
                historyData.insert(h.split('\n>').join(''), this.name).then();
            }
            this.term.clearSelection();
        } else {
            const row = this.term.buffer.active.baseY + this.term.buffer.active.cursorY;
            if (this.oldRow != row || (this.oldRow == row && this.history == "")) {
                this.term.selectLines(row, row);
                this.history = this.term.getSelection().trim();
                this.oldRow = row;
                this.term.clearSelection();
            }
        }
    }

    clearSelection() {
        this.term.clearSelection();
    }

    changeColor(shell) {
        shell = shell.toString()
        this.colors.forEach(({regex, color}) => {
            const searchRegExp = regex;
            const list = shell.match(searchRegExp);
            if (list != null && list.length > 0) {
                list.forEach(l => {
                    shell = shell.replaceAll(l, color(l));
                });
            }
        });
        return shell;
    }

    writeAfter(shell) {
        this.initFlag = true;
    }

    runAfter() {

    }
}

module.exports = BaseService;
