<script lang="ts">
	// import QRCode from 'qrcode';
	// import {QRCode} from 'react-qrcode-logo/dist';

	import QrCode from './QRCode.svelte';

	let url = '';
	let foo;

	console.log('foo: ', foo);

	// QRCode.(
	// 	'some text',
	// 	{
	// 		errorCorrectionLevel: 'H',
	// 		color: {
	// 			// light: '#456',
	// 			dark: '#ab7003'
	// 		}
	// 	},
	// 	function (err, newUrl) {
	// 		console.log(newUrl);
	// 		url = newUrl;
	// 	}
	// );

	let inputValue = '';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{@html url}

<!-- on:change={(evnt) => handleChange(evnt.currentTarget.value)} -->
<input bind:value={inputValue} type="text" />

<!-- <QRCode value="testing12354" /> -->
{#key inputValue}
	<QrCode
		data={{
			value: inputValue, // 'Hello World',
			size: 500,
			logoImage: 'https://raw.githubusercontent.com/gcoro/react-qrcode-logo/master/res/qrcode-ts.png',
			removeQrCodeBehindLogo: true,
			logoPadding: 10,
			// logoImage: 'https://raw.githubusercontent.com/gcoro/react-qrcode-logo/master/res/',
			fgColor: '#5C1D05'
		}}
	/>
{/key}
