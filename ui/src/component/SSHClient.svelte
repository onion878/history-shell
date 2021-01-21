<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {onMount} from "svelte";
    import {addTerminal, matchSSHPath} from "./utils";
    import ContextMenu from "./ContextMenu.svelte";

    const SSHService = require('./app/cmd/ssh-service');
    const terminal = new SSHService();
    let dom, first: boolean = false;
    export let theme, init, config, id;
    onMount(() => {
        first = true;
        if (init) {
            initTerminal();
        }
    });

    const initTerminal = () => {
        addTerminal(id, terminal);
        terminal.init(dom, config);
    }

    const startTerminal = (flag) => {
        if (flag && terminal.term == null && first) {
            initTerminal();
        }
        if (flag) {
            fit();
        }
    }

    $: startTerminal(init);

    const fit = () => {
        terminal.fitTerm();
    }

    let menuX, menuY, menuShow = false, menu: any[] = [], now = null;
    const all: any[] = [
        {name: '复制', key: 'copy', icon: 'icofont-ui-copy'},
        {name: '粘贴', key: 'paste', icon: 'icofont-copy-invert'},
        {name: '清空屏幕', key: 'clear', icon: 'icofont-brush'},
    ];

    const onRightClick = (e) => {
        menuX = e.x;
        menuY = e.y;
        now = terminal.term.getSelection().replace(/\n/g, '').trim();
        if (now.length > 0) {
            if (matchSSHPath(now)) {
                menu = [{name: '进入目录', key: 'intoFolder', icon: 'icofont-hand-right'}].concat(all);
            } else {
                menu = all;
            }
        } else {
            menu = all;
        }
        menuShow = !menuShow;
    }

    const menuClick = ({detail}) => {
        switch (detail.key) {
            case "intoFolder": {
                terminal.cdTargetFolder(now);
                break;
            }
            case "copy": {
                navigator.clipboard.writeText(now);
                terminal.clearSelection();
                break;
            }
            case "paste": {
                terminal.copyToXterm();
                break;
            }
            case "clear": {
                terminal.clearTerm();
                break;
            }
            default:
                this.isWrite = true;
        }
    }
</script>

<style>
    .terminal {
        width: 100%;
        height: 100%;
    }
</style>
<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow}
             bind:x={menuX} bind:y={menuY}
             width="100"/>
<div class="terminal" on:contextmenu|preventDefault={(e) => onRightClick(e)} use:watchResize={fit} bind:this={dom}
     style="background-color: {theme.colors['termBackground']}"></div>