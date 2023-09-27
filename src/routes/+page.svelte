<script lang="ts">
	import { QrCode, EcValues, LogoPaddingStyles, QrStyles, type QrCodeProps } from '$lib';
	import { Accordion, AccordionItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	// import QrComponent from './QRCode.svelte';

	let qrCode: QrCode;

	let formValues: QrCodeProps = {
		// Required
		value: '',
		// Common
		size: 150,
		// FIXME: Add CSS color regex?
		bgColor: '',
		fgColor: '',

		// Image
		logoImage: '',
		// Image Details
		removeQrCodeBehindLogo: false,
		logoHeight: undefined,
		logoOpacity: undefined,
		logoPadding: undefined,
		logoWidth: undefined,

		// Advanced
		ecLevel: EcValues.MEDIUM,
		quietZone: undefined,
		logoPaddingStyle: LogoPaddingStyles.SQUARE,
		qrStyle: QrStyles.SQUARES,

		// Enable loading images from external sources...
		enableCORS: true
	};

	async function handleSubmit(target: EventTarget & HTMLFormElement) {
		// Image
		if (
			formValues.logoImage !== undefined &&
			formValues.logoImage.length === 0 &&
			files !== null &&
			files.length > 0
		) {
			imageUrl = await awaitFileLoadToBase64(files[0]);
		}

		const tmpQrCode = new QrCode(formValues);

		if (imageUrl) {
			qrCode = await tmpQrCode.addImage(imageUrl);
		} else {
			qrCode = tmpQrCode;
		}
	}

	function awaitFileLoadToBase64(file: File) {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();

			reader.readAsDataURL(file);

			reader.addEventListener('load', () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
				} else {
					reject('Unable to read file.');
				}
			});
		});
	}

	let imageUrl = '';
	let files: FileList | null;
	let tabSet = 0;

	function handleImageUrlRemove() {
		imageUrl = '';
	}

	function handleImageFileRemove() {
		const imageElement = document.getElementById('imageFile');
		if (imageElement !== null && imageElement instanceof HTMLInputElement) {
			imageElement.value = '';
			files = null;
		}
	}

	let disableRemove = false;

	$: {
		disableRemove = typeof files === 'undefined' || files === null;
		console.log(formValues);
	}
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center w-full max-w-lg">
	<!-- <div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">Welcome to Skeleton.</h2>
	</div> -->

	<form
		class="py-4 flex w-full flex-col space-y-2"
		on:submit|preventDefault={({ currentTarget }) => {
			handleSubmit(currentTarget);
		}}
	>
		<label class="label">
			<span>QR Value:</span>
			<input class="input" name="value" type="text" bind:value={formValues.value} required />
		</label>

		<label class="label">
			<span>QR Size:</span>
			<input class="input" name="size" type="number" bind:value={formValues.size} step="10" />
		</label>

		<label class="label">
			<span>Background color:</span>
			<input class="input" name="bgColor" bind:value={formValues.bgColor} type="text" />
		</label>

		<label class="label">
			<span>Foreground color:</span>
			<input class="input" name="fgColor" bind:value={formValues.fgColor} type="text" />
		</label>

		<!-- If they have a link I will recommend the logoPadding -->
		<!-- TODO: I'td be nice if this didn't have to reset... -->
		<!-- on:click={() => {
				handleImageFileRemove();
				handleImageUrlRemove();
			}} -->
		<TabGroup>
			<Tab bind:group={tabSet} name="imageUrlTab" value={0}>
				<span>Image URL</span>
			</Tab>

			<Tab bind:group={tabSet} name="imageFileTab" value={1}>
				<span>Image File</span>
			</Tab>

			<svelte:fragment slot="panel">
				{#if tabSet === 0}
					<label class="label">
						<span>Image URL</span>
						<div class="input-group input-group-divider grid-cols-[1fr_auto]">
							<input
								bind:value={imageUrl}
								disabled={!disableRemove}
								class="input"
								name="imageUrl"
								type="text"
							/>

							<button
								disabled={!disableRemove || imageUrl.trim().length === 0}
								class={`btn variant-filled-error ${
									(disableRemove || imageUrl.trim().length > 0) && 'disabled'
								}`}
								on:click|preventDefault={handleImageUrlRemove}
							>
								Remove
							</button>
						</div>
					</label>
				{:else if tabSet === 1}
					<label class="label">
						<span>Uploaded Image</span>
						<div class="input-group input-group-divider grid-cols-[1fr_auto]">
							<input
								bind:files
								id="imageFile"
								class="input"
								type="file"
								name="imageFile"
								accept="image/*"
								disabled={imageUrl.trim().length > 0}
							/>

							<button
								disabled={disableRemove || imageUrl.trim().length > 0}
								class={`btn variant-filled-error ${
									(disableRemove || imageUrl.trim().length > 0) && 'disabled'
								}`}
								on:click|preventDefault={handleImageFileRemove}
							>
								Remove
							</button>
						</div>
					</label>
				{/if}
			</svelte:fragment>
		</TabGroup>

		<Accordion autocollapse>
			<AccordionItem>
				<svelte:fragment slot="summary">Image Details</svelte:fragment>
				<svelte:fragment slot="content">
					<section class="flex w-full space-x-8">
						<label class="label md:w-1/2">
							<span>Adjust Height of Logo:</span>
							<input
								class="input"
								name="logoHeight"
								bind:value={formValues.logoHeight}
								type="number"
							/>
						</label>

						<label class="label md:w-1/2">
							<span>Adjust Width of Logo:</span>
							<input
								class="input"
								name="logoWidth"
								bind:value={formValues.logoWidth}
								type="number"
							/>
						</label>
					</section>

					<label class="label">
						<span>Image Padding:</span>
						<input
							class="input"
							name="imagePadding"
							bind:value={formValues.logoPadding}
							type="number"
						/>
					</label>

					<label class="label">
						<span>Image Opacity:</span>
						<input
							class="input"
							name="logoOpacity"
							bind:value={formValues.logoOpacity}
							type="number"
							min="0"
							max="1"
							step="0.1"
						/>
					</label>

					<label class="flex items-center space-x-2">
						<input
							class="checkbox"
							name="removeQrCodeBehindLogo"
							bind:checked={formValues.removeQrCodeBehindLogo}
							type="checkbox"
						/>
						<p>Remove QR behind logo:</p>
					</label>
				</svelte:fragment>
			</AccordionItem>

			<AccordionItem>
				<svelte:fragment slot="summary">Advanced</svelte:fragment>
				<svelte:fragment slot="content">
					<label class="label">
						Error correction level:
						<select class="select" name="ecLevel" bind:value={formValues.ecLevel}>
							{#each Object.entries(EcValues) as [label, value]}
								<option {value}><span>{label.toLowerCase()}</span></option>
							{/each}
						</select>
					</label>

					<label class="label">
						<span>Space around QR Code:</span>
						<input class="input" name="quietZone" bind:value={formValues.quietZone} type="number" />
					</label>

					<label class="label">
						Logo Padding Style:
						<select class="select" name="logoPaddingStyle" bind:value={formValues.logoPaddingStyle}>
							{#each Object.entries(LogoPaddingStyles) as [label, value]}
								<option {value}>{label.toLowerCase()}</option>
							{/each}
						</select>
					</label>

					<label class="label">
						QR Style:
						<select class="select" name="qrStyle" bind:value={formValues.qrStyle}>
							{#each Object.entries(QrStyles) as [label, value]}
								<option {value}>{label.toLowerCase()}</option>
							{/each}
						</select>
					</label>
				</svelte:fragment>
			</AccordionItem>
		</Accordion>

		<!-- TODO: Add "additional tab" for detailed params -->

		<button class="mt-4 btn variant-ghost">Create QR code!</button>
	</form>

	<div class="max-w-sm md:max-w-lg">
		{#key qrCode?.dataUrl}
			{#if typeof qrCode?.dataUrl !== 'undefined'}
				<img alt="generated qr code" src={qrCode.dataUrl} />
			{/if}
		{/key}

		<!-- <div>
			<QrComponent
				data={{
					value: 'testing.com',
					size: 500,
					logoImage:
						'https://raw.githubusercontent.com/gcoro/react-qrcode-logo/master/res/qrcode-ts.png',
					logoPadding: 10,
					removeQrCodeBehindLogo: true,
					// logoWidth: 300,
					// logoHeight: 300,
					enableCORS: true
				}}
			/>
		</div> -->
	</div>
</div>
