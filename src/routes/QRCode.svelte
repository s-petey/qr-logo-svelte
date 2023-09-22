<script lang="ts">
	import { QrCode } from '$lib';
	import type { QrCodeProps } from '$lib';
	import { onMount } from 'svelte';

	export let data: QrCodeProps;

	let qrCode: QrCode;

	onMount(async () => {
		const tmpQrCode = new QrCode(data);
		if (typeof data.logoImage?.trim() === 'string') {
			qrCode = await tmpQrCode.addImage(data.logoImage);
		} else {
			qrCode = tmpQrCode;
		}
	});
</script>

{#key qrCode}
	{#if typeof qrCode !== 'undefined'}
		<img alt="generated qr code" src={qrCode.dataUrl} />
	{/if}
{/key}
