import App from './App.svelte';

declare function require(arg: string);

const app = new App({
    target: document.body,
    props: {
        name: 'world',
        theme: require('./app/utils/theme').getTheme(0),
    }
});

export default app;
