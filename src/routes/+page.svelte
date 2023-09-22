<script lang="ts">
	import { QrCode, type QrCodeProps } from '$lib';
	import { Accordion, AccordionItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	// import QrComponent from './QRCode.svelte';

	// TODO: Move this / make an enum?
	const ecValues: QrCodeProps['ecLevel'][] = ['H', 'L', 'M', 'Q'];
	const logoPaddingValues: QrCodeProps['logoPaddingStyle'][] = ['circle', 'square'];
	const qrStyleValues: QrCodeProps['qrStyle'][] = ['squares', 'dots'];

	let qrCode: QrCode;

	// TODO: START -- MOVE TO CLASS
	function getFormString(value: FormDataEntryValue | null): string | undefined {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value;
		}

		return undefined;
	}
	function getFormBoolean(value: FormDataEntryValue | null): boolean | undefined {
		if (typeof value === 'string') {
			return value === 'on';
		}

		return undefined;
	}

	function getFormNumber(value: FormDataEntryValue | null): number | undefined {
		if (typeof value === 'string') {
			const tmpValue = parseInt(value);
			if (!isNaN(tmpValue) && tmpValue >= 0) {
				return tmpValue;
			}
		}

		return undefined;
	}

	function getEcValue(value: FormDataEntryValue | null | QrCodeProps['ecLevel']) {
		const found = ecValues.find((val) => val === value);

		return found;
	}

	function getLogoPaddingValues(
		value: FormDataEntryValue | null | QrCodeProps['logoPaddingStyle']
	) {
		const found = logoPaddingValues.find((val) => val === value);

		return found;
	}

	function getQrStyleValues(value: FormDataEntryValue | null | QrCodeProps['qrStyle']) {
		const found = qrStyleValues.find((val) => val === value);

		return found;
	}

	// TODO: -- END MOVE TO CLASS

	// I'm unable to do server side work, so I will use
	// the submit as if it were a POST to the server.
	async function handleSubmit(target: EventTarget & HTMLFormElement) {
		const formData = new FormData(target);
		const value = getFormString(formData.get('value'));

		if (typeof value !== 'string') return;

		// Image
		let imageUrl: QrCodeProps['logoImage'] = getFormString(formData.get('imageUrl'));
		const maybeImageFile = formData.get('imageFile');
		if (maybeImageFile instanceof File && maybeImageFile.size > 0) {
			imageUrl = await awaitFileLoadToBase64(maybeImageFile);
		}

		const tmpQrCode = new QrCode({
			// Required
			value,
			// Common
			size: getFormNumber(formData.get('size')),
			// FIXME: Add CSS color regex?
			bgColor: getFormString(formData.get('bgColor')),
			fgColor: getFormString(formData.get('fgColor')),

			// Image
			logoImage: imageUrl,
			// Image Details
			removeQrCodeBehindLogo: getFormBoolean(formData.get('removeQrCodeBehindLogo')),
			logoHeight: getFormNumber(formData.get('logoHeight')),
			logoOpacity: getFormNumber(formData.get('logoOpacity')),
			logoPadding: getFormNumber(formData.get('imagePadding')),
			logoWidth: getFormNumber(formData.get('logoWidth')),

			// Advanced
			ecLevel: getEcValue(formData.get('ecLevel')),
			quietZone: getFormNumber(formData.get('quietZone')),
			logoPaddingStyle: getLogoPaddingValues(formData.get('logoPaddingStyle')),
			qrStyle: getQrStyleValues(formData.get('qrStyle')),

			// Enable loading images from external sources...
			enableCORS: true
		});

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
			<input class="input" name="value" type="text" required />
		</label>

		<label class="label">
			<span>QR Size:</span>
			<input class="input" name="size" type="text" />
		</label>

		<label class="label">
			<span>Background color:</span>
			<input class="input" name="bgColor" type="text" />
		</label>

		<label class="label">
			<span>Foreground color:</span>
			<input class="input" name="fgColor" type="text" />
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
							<input class="input" name="logoHeight" type="number" />
						</label>

						<label class="label md:w-1/2">
							<span>Adjust Width of Logo:</span>
							<input class="input" name="logoWidth" type="number" />
						</label>
					</section>

					<label class="label">
						<span>Image Padding:</span>
						<input class="input" name="imagePadding" type="number" />
					</label>

					<label class="label">
						<span>Image Opacity:</span>
						<input class="input" name="logoOpacity" type="number" />
					</label>

					<label class="flex items-center space-x-2">
						<input class="checkbox" name="removeQrCodeBehindLogo" type="checkbox" />
						<p>Remove QR behind logo:</p>
					</label>
				</svelte:fragment>
			</AccordionItem>

			<AccordionItem>
				<svelte:fragment slot="summary">Advanced</svelte:fragment>
				<svelte:fragment slot="content">
					<label class="label">
						Error correction level:
						<select class="select" name="ecLevel" value="M">
							<option value="L">Low</option>
							<option value="M">Medium</option>
							<option value="Q">Quartile</option>
							<option value="H">High</option>
						</select>
					</label>

					<label class="label">
						<span>Space around QR Code:</span>
						<input class="input" name="quietZone" type="number" />
					</label>

					<label class="label">
						Logo Padding Style:
						<select class="select" name="logoPaddingStyle" value="square">
							<option value="square">Square</option>
							<option value="circle">Circle</option>
						</select>
					</label>

					<label class="label">
						QR Style:
						<select class="select" name="qrStyle" value="squares">
							<option value="squares">Squares</option>
							<option value="dots">Dots</option>
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
