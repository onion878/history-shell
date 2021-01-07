<script>
    import {onMount} from "svelte";
    import { watchResize } from "svelte-watch-resize";
    const terminal = require("./app/cmd/terminal-service");
    export let name;
    export let theme;
    export let quickShow = "none";
    let mainLoading = "block";
    import TitleBar from "./component/TitleBar.svelte";
    import StatusBar from "./component/StatusBar.svelte";
    import ActivityBar from "./component/ActivityBar.svelte";
    import SplitBar from "./component/SplitBar.svelte";
    import SideBar from "./component/SideBar.svelte";
    import QuickInput from "./component/QuickInput.svelte";

    let msg = "hello";
    const toggleConsole = () => {
        msg = msg + "Onion ";
    };
    const toggleTerminal = () => {
        msg = msg + "Onion ==";
    };

    console.log(JSON.stringify(theme.colors));
    let xterm;
    onMount(() => {
        terminal.init(xterm);
    });
    const fitTerm = () => {
        terminal.fitTerm();
        console.log('fit');
    }
</script>

<style>
    .main {
        width: 100%;
        height: 100%;
        background: var(--background);
        color: var(--color);
    }

    .main > .content {
        --width: calc(100% - 50px);
        width: var(--width);
        top: 30px;
        bottom: 22px;
        left: 50px;
        position: absolute;
    }
</style>

<svelte:head>
    <style>
        :focus {
            outline-color: var(--focus-border);
        }

        input:focus {
            outline-width: 1px;
            outline-style: solid;
            outline-offset: -1px;
            opacity: 1 !important;
        }

        .monaco-progress-container {
            width: 100%;
            height: 2px;
            z-index: 2;
            position: relative;
            overflow: hidden;
        }

        .monaco-progress-container .progress-bit {
            width: inherit;
            height: 5px;
            opacity: 1;
            position: absolute;
            left: 0;
            animation: move 3s infinite;
            display: none;
        }

        @keyframes move {
            from {
                left: 0px;
                width: 5%;
            }
            to {
                left: 100%;
                width: 10%;
            }
        }

        @-webkit-keyframes move {
            from {
                left: 0px;
                width: 5%;
            }
            to {
                left: 100%;
                width: 10%;
            }
        }
    </style>
</svelte:head>
<div
        class="main"
        style="--background: {theme.colors.foreground}; --color: {theme.colors['background']};
  --focus:{theme.colors['focus']}; --focus-border: {theme.colors['focusBorder']};
  --shadow: {theme.colors['widget.shadow']}">
    <TitleBar title="Onion" bind:theme bind:msg/>
    <div class="monaco-progress-container">
        <div
                class="progress-bit"
                style="background-color: {theme.colors['progressBar.background']};opacity:
      1;display:{mainLoading}"/>
    </div>
    <ActivityBar title="Onion" bind:theme bind:msg/>
    <div class="content">
        <SplitBar>
            <div slot="left" style="width: 100%;height: 100%;">
                <SideBar bind:theme bind:msg/>
            </div>
            <div slot="right" style="height: 100%;" use:watchResize={fitTerm} bind:this={xterm}></div>
        </SplitBar>
    </div>
    <StatusBar
            bind:theme
            bind:msg
            on:toggleConsole={toggleConsole}
            on:toggleTerminal={toggleTerminal}/>
    <QuickInput bind:theme bind:msg bind:show={quickShow}/>
</div>
