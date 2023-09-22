<script lang="ts">
	import { QrCode, type QrCodeProps } from '$lib';
	// import QrComponent from './QRCode.svelte';

	let qrCode: QrCode;

	// I'm unable to do server side work, so I will use
	// the submit as if it were a POST to the server.
	async function handleSubmit(target: EventTarget & HTMLFormElement) {
		const formData = new FormData(target);
		// const formData = await request.formData();
		const value = formData.get('value');
		if (typeof value !== 'string') return;
		let maybeEcLevel = formData.get('ecLevel');
		let ecLevel: QrCodeProps['ecLevel'];
		if (maybeEcLevel instanceof File) {
			ecLevel = undefined;
		} else if (typeof maybeEcLevel === 'string') {
			// TODO: Verify data...
			//@ts-ignore
			ecLevel = maybeEcLevel;
		}
		const maybeSize = formData.get('size');
		let size: QrCodeProps['size'] = undefined;
		if (typeof maybeSize === 'string' && !isNaN(parseInt(maybeSize))) {
			size = parseInt(maybeSize);
		}
		const maybeBgColor = formData.get('bgcolor');
		let bgColor: QrCodeProps['bgColor'] = undefined;
		if (typeof maybeBgColor === 'string') {
			bgColor = maybeBgColor;
		}
		const maybeFgColor = formData.get('fgColor');
		let fgColor: QrCodeProps['fgColor'] = undefined;
		if (typeof maybeFgColor === 'string') {
			fgColor = maybeFgColor;
		}
		const maybeImageUrl = formData.get('imageUrl');
		const maybeImageFile = formData.get('imageFile');
		let imageUrl: QrCodeProps['logoImage'] = undefined;
		if (typeof maybeImageUrl === 'string' && maybeImageUrl.trim().length > 0) {
			imageUrl = maybeImageUrl;
		} else if (maybeImageFile instanceof File && maybeImageFile.size > 0) {
			imageUrl = await awaitFileLoadToBase64(maybeImageFile);
		}

		const tmpQrCode = new QrCode({
			//
			value,
			ecLevel,
			size,
			bgColor,
			fgColor,
			logoImage: imageUrl,
			// Enable loading images from external sources...
			enableCORS: true,
			//
			logoPadding: 10,
			removeQrCodeBehindLogo: true
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

	function handleRemove() {
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

<div class="container h-full mx-auto flex flex-col justify-center items-center">
	<!-- <div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">Welcome to Skeleton.</h2>
	</div> -->

	<form
		class="py-4"
		on:submit|preventDefault={({ currentTarget }) => {
			handleSubmit(currentTarget);
		}}
	>
		<label class="label">
			<span>QR Value:</span>
			<input class="input" name="value" type="text" required />
		</label>

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
		<section>
			<h5 class="my-4">You can use an image url <strong>or</strong> upload your own!</h5>
			<label class="label">
				<span>Image URL</span>
				<input
					bind:value={imageUrl}
					disabled={!disableRemove}
					class="input"
					name="imageUrl"
					type="text"
				/>
			</label>

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
						on:click|preventDefault={handleRemove}
					>
						Remove
					</button>
				</div>
			</label>
		</section>

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
