<script>
  export let theme, msg, loading, show;
  import { afterUpdate } from "svelte";
  let input;
  afterUpdate(() => {
    if (show == "block") {
      input.focus();
    }
  });
</script>

<style>
  .quick-input-widget {
    position: absolute;
    width: 60%;
    top: 30px;
    padding-bottom: 6px;
    left: 50%;
    margin-left: -30%;
    box-shadow: var(--shadow) 0px 5px 8px;
  }

  .quick-input-header {
    display: flex;
    padding: 6px 6px 0;
    margin-bottom: -2px;
  }

  .quick-input-and-message {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    position: relative;
  }

  .quick-input-filter {
    flex-grow: 1;
    display: flex;
    position: relative;
  }

  .monaco-inputbox {
    position: relative;
    display: block;
    padding: 0;
    -o-box-sizing: border-box;
    -ms-box-sizing: border-box;
    box-sizing: border-box;
    line-height: auto !important;
    font-size: inherit;
  }
  .monaco-inputbox.idle {
    border: 1px solid transparent;
  }

  .monaco-inputbox > .wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .monaco-inputbox > .wrapper > .input {
    display: inline-block;
    -o-box-sizing: border-box;
    -ms-box-sizing: border-box;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    line-height: inherit;
    border: none;
    font-family: inherit;
    font-size: inherit;
    resize: none;
    color: inherit;
  }

  .monaco-inputbox > .wrapper > .input {
    padding: 4px;
  }
  .monaco-inputbox > .wrapper > input {
    text-overflow: ellipsis;
  }

  .monaco-inputbox > .wrapper > input:focus {
    outline-color: var(--focus-border);
  }

  .quick-input-box {
    flex-grow: 1;
  }
</style>

<div
  class="quick-input-widget show-file-icons"
  style="display: {show};background: {theme.colors['editorWidget.background']};">
  <div class="quick-input-header">
    <div class="quick-input-and-message">
      <div class="quick-input-filter">
        <div class="quick-input-box">
          <div class="monaco-inputbox idle">
            <div class="wrapper">
              <input
                style="background-color:{theme.colors['input.background']};color:
                {theme.colors['input.foreground']}"
                bind:this={input}
                on:blur={() => (show = 'none')}
                class="input"
                type="text"
                placeholder="选择操作"
                title="选择操作" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="monaco-progress-container">
    <div
      class="progress-bit"
      style="background-color: {theme.colors['progressBar.background']};width:
      20px;opacity: 1;display:{loading}" />
  </div>
</div>
