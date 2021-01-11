<script lang="ts">
    export let theme, placeholder, type = 'text', value;
    const handleInput = e => {
        // in here, you can switch on type and implement
        // whatever behaviour you need
        value = type.match(/^(number|range)$/)
            ? +e.target.value
            : e.target.value;
    };
</script>

<style>

    .input {
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
        padding: 4px;
        text-overflow: ellipsis;
    }

    input:focus {
        outline-color: var(--focus-border);
    }
</style>

<input
       style="background-color:{theme.colors['input.background']};color:
                {theme.colors['input.foreground']}"
       class="input"
       {type} {value} {placeholder} on:input={handleInput}/>