<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {onMount} from "svelte";
    import {addTerminal} from "./utils";

    const TerminalService = require('./app/cmd/terminal-service');
    const terminal = new TerminalService();
    let dom, first = false;
    export let init, path = null, id;
    onMount(() => {
        first = true;
        if (init) {
            initTerminal();
        }
    });

    const initTerminal = () => {
        addTerminal(id, terminal);
        terminal.init(dom, path);
        dom.style.background = terminal.getBackgroundColor();
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
</script>

<style>
    .terminal {
        width: 100%;
        height: 100%;
    }
</style>

<div class="terminal" use:watchResize={fit} bind:this={dom}></div>