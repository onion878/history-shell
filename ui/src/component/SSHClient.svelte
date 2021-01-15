<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {onMount} from "svelte";
    import {addTerminal} from "./utils";

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
</script>

<style>
    .terminal {
        width: 100%;
        height: 100%;
    }
</style>

<div class="terminal" use:watchResize={fit} bind:this={dom} style="background-color: {theme.colors['termBackground']}"></div>