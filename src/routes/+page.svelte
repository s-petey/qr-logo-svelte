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
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{@html url}

<!-- <QRCode value="testing12354" /> -->
<QrCode data={{
  value: 'https://github.com/gcoro/react-qrcode-logo',
  size: 500,
  logoImage: 'https://github.com/gcoro/react-qrcode-logo/blob/master/res/qrcode-ts.png'
}} />
