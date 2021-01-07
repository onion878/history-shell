const c = require('ansi-colors');
const SearchAddon = require('xterm-addon-search').SearchAddon;
const SearchAddonBar = require('xterm-addon-search-bar').SearchBarAddon;
const Unicode11Addon = require('xterm-addon-unicode11').Unicode11Addon;
const WebLinksAddon = require('xterm-addon-web-links').WebLinksAddon;
const themes = require('../../assets/config/windows-terminal-themes.json');

class BaseService {

    constructor() {
        this.term = null;
        this.searchBar = null;
        this.isWrite = true;
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
        let i = 0;
        setInterval(() => {
            const theme = themes[i];
            const d = {
                cursor: theme.brightBlack,
                selection: theme.brightWhite,
                ...theme
            };
            this.term?.setOption('theme', d);
            i++;
        }, 1000);
    }

    getTermOptions() {
        const that = this;
        // Initialize xterm.js and attach it to the DOM
        let font = '"Cascadia Code","Fira Mono","IBM Plex Mono","Menlo",Consolas,monospace,monospace',
            fontSize = 13;
        const theme = themes[8];
        return {
            // fontSize: fontSize,
            // fontFamily: font,
            theme: {
                cursor: theme.brightBlack,
                selection: theme.brightWhite,
                ...theme
            }
        };
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
        that.term.element.addEventListener('contextmenu', (e) => {
            if (that.term.hasSelection()) {
                document.execCommand('copy');
                that.term.select(0, 0, 0);
            } else {
                navigator.clipboard.readText().then(r => {
                    if (r.length > 0) {
                        that.write(r);
                    }
                });
            }
        })
        this.term.onKey(({domEvent}) => {
            console.log(domEvent.key);
            if (domEvent.ctrlKey) {
                switch (domEvent.key) {
                    case "f": {
                        console.log(that.term);
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
                        navigator.clipboard.readText().then(r => {
                            this.isWrite = true;
                            if (r.length > 0) {
                                that.write(r);
                            }
                        });
                        break;
                    }
                    default:
                        this.isWrite = true;
                }
            } else {
                this.isWrite = true;
            }
            if (domEvent.key == 'Escape') {
                that.searchBar?.hidden();
            }
        });
    }

    writeToXterm(shell) {
        this.term.write(this.changeColor(shell));
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
}

module.exports = BaseService;