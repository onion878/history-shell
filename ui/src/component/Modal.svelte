<script lang="ts">
    import {createEventDispatcher, onMount} from "svelte";
    import hotkeys from "hotkeys-js";

    export let theme, show = false, title = '标题', width = 200;
    let offset = [0, 0];
    let divOverlay, divDrag;
    let isDown = false, initFlag = false;

    const dispatch = createEventDispatcher();

    onMount(() => {
        initFlag = true;
        if (show) {
            initDrag(show);
        }
    });

    const initPosition = () => {
        // init modal position
        divOverlay.style.left = (document.body.offsetWidth - divOverlay.offsetWidth) / 2 + 'px';
        divOverlay.style.top = (document.body.offsetHeight - divOverlay.offsetHeight) / 4 + 'px';
    };

    const initDrag = (s) => {
        if (!s || !initFlag) {
            return;
        }
        setTimeout(() => {
            initPosition();
        }, 0);
        divDrag.addEventListener('mousedown', function (e) {
            isDown = true;
            offset = [
                divOverlay.offsetLeft - e.clientX,
                divOverlay.offsetTop - e.clientY
            ];
        }, true);

        document.addEventListener('mouseup', function () {
            isDown = false;
        }, true);

        document.addEventListener('mousemove', function (e) {
            if (isDown) {
                const x = (e.clientX + offset[0]);
                const y = (e.clientY + offset[1]);
                let dragX = true, dragY = true;
                if (x < 0 || x + parseInt(width + "") > document.body.offsetWidth) {
                    dragX = false;
                }
                if (y < 0 || y > document.body.offsetHeight - divOverlay.offsetHeight) {
                    dragY = false;
                }
                if (dragX) {
                    divOverlay.style.left = x + 'px';
                }
                if (dragY) {
                    divOverlay.style.top = y + 'px';
                }
            }
        }, true);
    }
    $:initDrag(show);

    const saveClick = () => {
        dispatch('save');
    }

    hotkeys('esc', function (event, handler) {
        event.preventDefault();
        show = false;
    });
</script>

<style>
    .modal {
        position: fixed;
        z-index: 10;
        top: 50px;
        left: 400px;
        box-shadow: var(--shadow) 0px 5px 8px;
        line-height: 35px;
    }

    .modal > .modal-header {
        height: 35px;
        width: 100%;
    }

    .modal > .modal-header > .modal-title {
        height: 35px;
        width: calc(100% - 35px);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        float: left;
    }

    .modal > .modal-header > .modal-close {
        width: 35px;
        float: right;
        font-size: 16px;
        text-align: center;
        font-family: 'Icofont';
    }

    .modal > .modal-header > .modal-close:hover {
        background-color: var(--focus);
    }

    .modal > .modal-header > .modal-close:before {
        content: '\eee4';
    }

    .modal > .modal-content {
        margin: 5px;
    }

    .modal > .modal-footer {
        width: 100%;
        height: 35px;
    }

    .modal > .modal-footer > .modal-btn {
        height: 100%;
        text-align: center;
        float: right;
        padding: 0px 10px;
    }

    .modal > .modal-footer > .modal-btn:hover {
        background-color: var(--focus);
    }
</style>
<div class="modal" bind:this={divOverlay}
     style="width: {width}px;background: {theme.colors['editorWidget.background']};display: {show?'block':'none'};">
    <div class="modal-header" bind:this={divDrag}
         style="background-color: {theme.colors['titleBar.activeBackground']}" title={title}>
        <div class="modal-title">&nbsp;{title}</div>
        <div class="modal-close" on:click={()=> show=false}></div>
    </div>
    <div class="modal-content">
        <slot/>
    </div>
    <div class="modal-footer" style="background-color: {theme.colors['titleBar.activeBackground']}">
        <div class="modal-btn" on:click={()=> saveClick()}>保存</div>
        <div class="modal-btn" on:click={()=> show=false}>取消</div>
    </div>
</div>