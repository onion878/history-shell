<script lang="ts">
  export let theme, msg;
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let action = "";
  const toggleTemplate = () => {
    if (action == "template") {
      action = "";
    } else {
      action = "template";
    }
  };
  const toggleScript = () => {
    if (action == "script") {
      action = "";
    } else {
      action = "script";
    }
  };
</script>

<style>
  .activitybar {
    width: 50px;
    height: calc(100%-22px);
    top: 30px;
    bottom: 0px;
    left: 0px;
    position: absolute;
  }

  .activitybar > .content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 13px;
  }

  .actions-container {
    display: inline-block;
    margin: 0 auto;
    padding: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .activitybar > .content .monaco-action-bar .action-item {
    display: block;
    position: relative;
    padding: 5px 0;
    outline: none;
  }

  .activitybar
    > .content
    .monaco-action-bar
    .action-item.checked
    > .action-label {
    color: var(--activity-focus);
  }

  .activitybar > .content .monaco-action-bar .action-label {
    display: flex;
    overflow: hidden;
    height: 40px;
    line-height: 40px;
    margin-right: 0;
    padding: 0 0 0 9px;
    box-sizing: border-box;
    font-size: 15px;
    cursor: pointer;
    font-size: 28px;
    font-family: 'Icofont';
    color: var(--activity-color);
  }

  .activitybar > .content .monaco-action-bar .action-label:hover {
    color: var(--activity-focus);
  }

  .activitybar .monaco-action-bar .action-label.template:before {
    content: '\eeff';
  }

  .activitybar .monaco-action-bar .action-label.script:before {
    content: '\ec5b';
  }
</style>

<div
  class="activitybar"
  style="background: {theme.colors['activityBar.background']}; --activity-color:
  {theme.colors['activityBar.inactiveForeground']};--activity-focus: {theme.colors['activityBar.foreground']};"
  role="navigation">
  <div class="content" style="width: 50px;">
    <div class="composite-bar">
      <div class="monaco-action-bar vertical">
        <ul
          class="actions-container"
          role="toolbar"
          aria-label="活动视图切换器">
          <li
            class="action-item"
            class:checked={action == 'template'}
            role="button"
            draggable="true"
            tabindex="0"
            title="生成模板"
            on:click={toggleTemplate}>
            <div class="action-label template" />
          </li>
          <li
            class="action-item"
            class:checked={action == 'script'}
            role="button"
            draggable="true"
            tabindex="0"
            title="数据脚本"
            on:click={toggleScript}>
            <div class="action-label script" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
