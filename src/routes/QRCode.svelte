<script lang="ts">
	import { QrCode } from '$lib';
	import type { QrCodeProps } from '$lib';
	import { onMount } from 'svelte';

	export let data: QrCodeProps;

	let qrCode: QrCode;

	onMount(() => {
		qrCode = new QrCode(data);
	});
</script>

{#key qrCode?.dataUrl}
	{#if typeof qrCode?.dataUrl !== 'undefined'}
		<img alt="generated qr code" src={qrCode.dataUrl} />
	{/if}
{/key}
