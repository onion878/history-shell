import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world',
		theme: require('./app/utils/theme').getTheme()
	}
});

export default app;