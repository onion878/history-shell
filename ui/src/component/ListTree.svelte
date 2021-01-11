<script lang="ts">
    import {createEventDispatcher} from "svelte";

    export let theme, index = 0, now, data = [];
    export let dispatch = createEventDispatcher();

    const itemClick = (item) => {
        now = item.id;
        dispatch('click', item);
    }

    const onRightClick = (item, e) => {
        dispatch('rightClick', {data: item, x: e.clientX, y: e.clientY});
    }
</script>

<style>
    .tree {
    }

    .tree-title {
        height: 25px;
        line-height: 25px;
        padding: 0px 5px;
        cursor: pointer;
        display: inline-flex;
        min-width: calc(100% - 10px);
    }

    .tree-title:hover {
        background-color: var(--focus);
    }

    .tree-title > div {
        float: left;
        height: 100%;
        box-sizing: border-box;
    }

    .tree-title > .tree-icon {
        width: 25px;
        background-position: center center;
        background-repeat: no-repeat no-repeat;
    }

    .tree-title > .tree-expanded {
        width: 12px;
        font-family: 'Icofont';
    }

    .tree-title > .tree-expanded.collapse:before {
        content: '\eab8';
    }

    .tree-title > .tree-expanded.expanded:before {
        content: '\eab2';
    }
</style>
{#each data as d}
    <div class="tree">
        <div class="tree-title" style="background-color: {now == d.id?theme.colors['titleBar.activeBackground']:''}"
             on:click={() => itemClick(d)} on:contextmenu|preventDefault={(e) => onRightClick(d,e)}>
            <div style="width: {index*12}px"></div>
            <div class="tree-expanded" on:click={() => d.expanded = !d.expanded}
                 class:expanded={d.type === 'folder' && d.expanded}
                 class:collapse={d.type === 'folder' && !d.expanded}></div>
            <div class="tree-icon" style="background-image: url({d.icon})"></div>
            <div class="tree-text">{d.name}</div>
        </div>
        {#if d.type === 'folder' && d.expanded}
            <svelte:self bind:data={d.children} index={index+1} bind:now={now} bind:theme={theme} bind:dispatch={dispatch}/>
        {/if}
    </div>
{/each}