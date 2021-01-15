<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {onMount} from "svelte";
    import {addTerminal} from "./utils";

    const TerminalService = require('./app/cmd/terminal-service');
    const terminal = new TerminalService();
    let dom, first = false;
    export let theme, init, path = null, id;
    onMount(() => {
        first = true;
        if (init) {
            initTerminal();
        }
        dom.addEventListener('dragenter', dropHandler, false);
        dom.addEventListener('dragleave', dropHandler, false);
        dom.addEventListener('dragover', dropHandler, false);
        dom.addEventListener('drop', dropHandler, false);
    });

    const initTerminal = () => {
        addTerminal(id, terminal);
        terminal.init(dom, path);
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

    const dropHandler = (ev) => {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (ev.dataTransfer.items[i].kind === 'file') {
                    const file: any = ev.dataTransfer.items[i].getAsFile();
                    if (file) {
                        terminal.write(file.path.replace(/\\/g, '/'));
                    }
                }
            }
        }
    }
</script>

<style>
    .terminal {
        width: 100%;
        height: 100%;
    }
</style>

<div class="terminal" use:watchResize={fit} bind:this={dom} style="background-color: {theme.colors['termBackground']}"></div>