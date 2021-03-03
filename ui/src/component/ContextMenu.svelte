<script lang="ts">
    import hotkeys from 'hotkeys-js';
    import {createEventDispatcher} from "svelte";

    export let theme, target, show = false, x = 50, y = 50, width = 200, data = [];
    const dispatch = createEventDispatcher();

    const clickMenu = (item) => {
        show = false;
        dispatch('click', item);
    }

    hotkeys('esc', function (event, handler) {
        event.preventDefault();
        show = false;
    });

    const showMenu = (s) => {
        if (s) {
            const w = document.body.offsetWidth;
            const h = document.body.offsetHeight;
            if (x + parseInt(width + "") > w) {
                x = w - width;
            }
            const height = data.length * 27.6666;
            if (height + y > h) {
                y = h - height;
            }
        }
    }

    $:showMenu(show);
</script>

<style>
    .context-menu {
        position: absolute;
        min-width: 100px;
        box-shadow: var(--shadow) 0px 5px 8px;
        z-index: 3;
        background: var(--title-menu-background);
        font-family: 'Icofont';
    }

    .context-menu > .separator {
        height: 1px;
        margin-left: 4px;
        margin-right: 4px;
        background: var(--color);
    }

    .context-menu div {
        color: var(--title-menu-color);
        height: 25px;
        line-height: 25px;
        padding: 0px 10px;
        margin: 2px auto;
        text-decoration: none;
        display: block;
    }

    .context-menu > div:hover:not(.separator) {
        background: var(--focus);
    }

    .full-screen {
        z-index: 10;
        width: 100%;
        height: 100%;
        position: fixed;
        top: 0px;
        left: 0px;
        background-color: transparent;
    }
</style>
{#if show}
    <div class="full-screen" on:click={() => show=false}>
        <div class="context-menu" style="--title-bar-color: {theme.colors['titleBar.activeForeground']};
  --title-bar-background: {theme.colors['titleBar.activeBackground']};
  --title-menu-color: {theme.colors['menu.foreground']};
  --title-menu-background: {theme.colors['dropdown.background']};left:{x}px;top:{y}px;width:{width}px">
            {#each data as d}
                {#if d.show !== false}
                    {#if d.type == 'separator'}
                        <div class="separator"/>
                    {:else}
                        <div on:click|preventDefault={() => clickMenu(d)}>
                            <i class={d.icon}></i>
                            {d.name}
                        </div>
                    {/if}
                {/if}
            {/each}
        </div>
    </div>
{/if}
