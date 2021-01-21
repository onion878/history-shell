<script lang="ts">
    import {onMount} from "svelte";

    export let theme, width = "200px", center = "right";
    let container, left, right, handle, leftWidth;
    onMount(() => {
        initSplit();
    });

    const initSplit = () => {
        let isResizing = false,
            lastDownX = 0;
        handle.onmousedown = function (e) {
            isResizing = true;
            lastDownX = e.clientX;
        };

        let oldX = 0;

        container.addEventListener('mouseup', function () {
            isResizing = false;
        }, true);

        container.addEventListener('mousemove', function (e) {
            if (!isResizing) {
                return;
            }
            if (center == 'right' && leftWidth < 100 && e.x < oldX) {
                return;
            }
            if (center == 'right' && container.offsetWidth - leftWidth < 100 && e.x > oldX) {
                return;
            }
            if (center == 'left' && leftWidth < 100 && e.x > oldX) {
                return;
            }
            if (center == 'left' && container.offsetWidth - leftWidth < 100 && e.x < oldX) {
                return;
            }
            leftWidth = e.clientX - left.getBoundingClientRect().left;
            if (center == 'left') {
                leftWidth = container.offsetWidth - leftWidth;
            }
            width = leftWidth + "px";
            oldX = e.x;
        }, true);
    };
</script>

<style>
    .container {
        width: 100%;
        height: 100%;
        display: flex;
    }

    .container > .left_panel {
        display: flex;
    }

    .container > .left_panel > .drag {
        width: 2px;
        height: 100%;
        cursor: w-resize;
    }
</style>

<div class="container" bind:this={container}>
    <div class="left_panel" bind:this={left} style="flex: {center == 'right'? '0 0 ' + width: '1 1 auto'};">
        <div style="flex: 1 1 auto;">
            <slot name="left"/>
        </div>
        <div class="drag" bind:this={handle} style="background-color: {theme.colors['termBackground']}"/>
    </div>
    <div class="right_panel" bind:this={right} style="flex: {center == 'left'? '0 0 ' + width: '1 1 auto'};">
        <slot name="right"/>
    </div>
</div>
