<script>
  import { onMount } from "svelte";
  let container, left, right, handle;
  onMount(() => {
    initSplit();
  });

  const initSplit = () => {
    let isResizing = false,
      lastDownX = 0;
    handle.onmousedown = function(e) {
      isResizing = true;
      lastDownX = e.clientX;
    };
    let oldX = 0;
    document.onmousemove = function(e) {
      e.preventDefault();
      // we don't want to do anything if we aren't resizing.
      if (!isResizing) {
        return;
      }
      if (left.offsetWidth < 100 && e.x < oldX) {
        return;
      }
       if (right.offsetWidth < 100 && e.x > oldX) {
        return;
      }
      const offsetRight = e.clientX - 50;
      left.style.width = offsetRight + "px";
      right.style.left = offsetRight + "px";
      oldX = e.x;
    };

    document.onmouseup = function(e) {
      // stop resizing
      isResizing = false;
    };
  };
</script>

<style>
  .container {
    width: 100%;
    height: 100%;
  }

  .container > .left_panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 200px;
  }

  .container > .right_panel {
    position: absolute;
    top: 0;
    right: 0px;
    left: 200px;
    bottom: 0;
  }

  .container > .left_panel > .drag {
    position: absolute;
    right: -4px;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: w-resize;
  }
</style>

<div class="container" bind:this={container}>
  <div class="left_panel" bind:this={left}>
    <div class="drag" bind:this={handle} />
    <slot name="left" />
  </div>
  <div class="right_panel" bind:this={right}>
    <slot name="right" />
  </div>
</div>
