<script lang="ts">
	import QrCodeGenerator from 'qrcode-generator';
	import { onMount } from 'svelte';

	type EyeColor = string | InnerOuterEyeColor;
	type InnerOuterEyeColor = {
		inner: string;
		outer: string;
	};

	type CornerRadii = number | [number, number, number, number] | InnerOuterRadii;
	type InnerOuterRadii = {
		inner: number | [number, number, number, number];
		outer: number | [number, number, number, number];
	};
	interface IProps {
		value?: string;
		ecLevel?: 'L' | 'M' | 'Q' | 'H';
		enableCORS?: boolean;
		size?: number;
		quietZone?: number;
		bgColor?: string;
		fgColor?: string;
		logoImage?: string;
		logoWidth?: number;
		logoHeight?: number;
		logoOpacity?: number;
		logoOnLoad?: () => void;
		removeQrCodeBehindLogo?: boolean;
		logoPadding?: number;
		logoPaddingStyle?: 'square' | 'circle';
		eyeRadius?: CornerRadii | [CornerRadii, CornerRadii, CornerRadii];
		eyeColor?: EyeColor | [EyeColor, EyeColor, EyeColor];
		qrStyle?: 'squares' | 'dots';
		style?: object;
		id?: string;
	}

	interface ICoordinates {
		row: number;
		col: number;
	}

	const qrCodeSize = 150;

	export let data: IProps;

	let inputUrl = '';

	const defaultProps = {
		value: 'https://kit.svelte.dev/',
		ecLevel: 'M',
		enableCORS: false,
		size: qrCodeSize,
		quietZone: 10,
		bgColor: '#FFFFFF',
		fgColor: '#000000',
		logoOpacity: 1,
		qrStyle: 'squares',
		eyeRadius: [0, 0, 0],
		logoPaddingStyle: 'square'
	} as const;

	let dataDefaulted = {
		...data,
		value: data.value ?? defaultProps.value,
		ecLevel: data.ecLevel ?? defaultProps.ecLevel,
		enableCORS: data.enableCORS ?? defaultProps.enableCORS,
		size: data.size ?? defaultProps.size,
		quietZone: data.quietZone ?? defaultProps.quietZone,
		bgColor: data.bgColor ?? defaultProps.bgColor,
		fgColor: data.fgColor ?? defaultProps.fgColor,
		logoOpacity: data.logoOpacity ?? defaultProps.logoOpacity,
		qrStyle: data.qrStyle ?? defaultProps.qrStyle,
		eyeRadius: data.eyeRadius ?? defaultProps.eyeRadius,
		logoPaddingStyle: data.logoPaddingStyle ?? defaultProps.logoPaddingStyle
	};

	function utf16to8(str: string): string {
		let out: string = '',
			i: number,
			c: number;
		const len: number = str.length;
		for (i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			if (c >= 0x0001 && c <= 0x007f) {
				out += str.charAt(i);
			} else if (c > 0x07ff) {
				out += String.fromCharCode(0xe0 | ((c >> 12) & 0x0f));
				out += String.fromCharCode(0x80 | ((c >> 6) & 0x3f));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
			} else {
				out += String.fromCharCode(0xc0 | ((c >> 6) & 0x1f));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
			}
		}
		return out;
	}

	/**
	 * Draw a rounded square in the canvas
	 */
	function drawRoundedSquare(
		lineWidth: number,
		x: number,
		y: number,
		size: number,
		color: string,
		radii: number | number[],
		fill: boolean,
		ctx: CanvasRenderingContext2D
	) {
		ctx.lineWidth = lineWidth;
		ctx.fillStyle = color;
		ctx.strokeStyle = color;

		// Adjust coordinates so that the outside of the stroke is aligned to the edges
		y += lineWidth / 2;
		x += lineWidth / 2;
		size -= lineWidth;

		if (!Array.isArray(radii)) {
			radii = [radii, radii, radii, radii];
		}

		// Radius should not be greater than half the size or less than zero
		radii = radii.map((r) => {
			r = Math.min(r, size / 2);
			return r < 0 ? 0 : r;
		});

		const rTopLeft = radii[0] || 0;
		const rTopRight = radii[1] || 0;
		const rBottomRight = radii[2] || 0;
		const rBottomLeft = radii[3] || 0;

		ctx.beginPath();

		ctx.moveTo(x + rTopLeft, y);

		ctx.lineTo(x + size - rTopRight, y);
		if (rTopRight) ctx.quadraticCurveTo(x + size, y, x + size, y + rTopRight);

		ctx.lineTo(x + size, y + size - rBottomRight);
		if (rBottomRight) ctx.quadraticCurveTo(x + size, y + size, x + size - rBottomRight, y + size);

		ctx.lineTo(x + rBottomLeft, y + size);
		if (rBottomLeft) ctx.quadraticCurveTo(x, y + size, x, y + size - rBottomLeft);

		ctx.lineTo(x, y + rTopLeft);
		if (rTopLeft) ctx.quadraticCurveTo(x, y, x + rTopLeft, y);

		ctx.closePath();

		ctx.stroke();
		if (fill) {
			ctx.fill();
		}
	}

	/**
	 * Draw a single positional pattern eye.
	 */
	function drawPositioningPattern(
		ctx: CanvasRenderingContext2D,
		cellSize: number,
		offset: number,
		row: number,
		col: number,
		color: EyeColor,
		radii: CornerRadii = [0, 0, 0, 0]
	) {
		const lineWidth = Math.ceil(cellSize);

		let radiiOuter: number | number[];
		let radiiInner: number | number[];
		if (typeof radii !== 'number' && !Array.isArray(radii)) {
			radiiOuter = radii.outer || 0;
			radiiInner = radii.inner || 0;
		} else {
			radiiOuter = radii; // as CornerRadii;
			radiiInner = radiiOuter;
		}

		let colorOuter;
		let colorInner;
		if (typeof color !== 'string') {
			colorOuter = color.outer;
			colorInner = color.inner;
		} else {
			colorOuter = color;
			colorInner = color;
		}

		let y = row * cellSize + offset;
		let x = col * cellSize + offset;
		let size = cellSize * 7;

		// Outer box
		drawRoundedSquare(lineWidth, x, y, size, colorOuter, radiiOuter, false, ctx);

		// Inner box
		size = cellSize * 3;
		y += cellSize * 2;
		x += cellSize * 2;
		drawRoundedSquare(lineWidth, x, y, size, colorInner, radiiInner, true, ctx);
	}
	/**
	 * Is this dot inside a positional pattern zone.
	 */
	function isInPositioninZone(col: number, row: number, zones: ICoordinates[]) {
		return zones.some(
			(zone) => row >= zone.row && row <= zone.row + 7 && col >= zone.col && col <= zone.col + 7
		);
	}

	function transformPixelLengthIntoNumberOfCells(pixelLength: number, cellSize: number) {
		return pixelLength / cellSize;
	}

	function isCoordinateInImage(
		col: number,
		row: number,
		dWidthLogo: number,
		dHeightLogo: number,
		dxLogo: number,
		dyLogo: number,
		cellSize: number,
		logoImage: string
	) {
		if (logoImage) {
			const numberOfCellsMargin = 2;
			const firstRowOfLogo = transformPixelLengthIntoNumberOfCells(dxLogo, cellSize);
			const firstColumnOfLogo = transformPixelLengthIntoNumberOfCells(dyLogo, cellSize);
			const logoWidthInCells = transformPixelLengthIntoNumberOfCells(dWidthLogo, cellSize) - 1;
			const logoHeightInCells = transformPixelLengthIntoNumberOfCells(dHeightLogo, cellSize) - 1;

			return (
				row >= firstRowOfLogo - numberOfCellsMargin &&
				row <= firstRowOfLogo + logoWidthInCells + numberOfCellsMargin && // check rows
				col >= firstColumnOfLogo - numberOfCellsMargin &&
				col <= firstColumnOfLogo + logoHeightInCells + numberOfCellsMargin
			); // check cols
		} else {
			return false;
		}
	}

	// RENDERABLE ACTIONS
	onMount(() => {
		update();
	});

	function shouldComponentUpdate(nextProps: IProps) {
		// DeepEqual?
		// return !isEqual(this.props, nextProps);
		return false;
	}

	// function componentDidMount() {
	// 	update();
	// }

	// function componentDidUpdate() {
	// 	update();
	// }

	function update() {
		const {
			value,
			ecLevel,
			enableCORS,
			bgColor,
			fgColor,
			logoImage,
			logoOpacity,
			logoOnLoad,
			removeQrCodeBehindLogo,
			qrStyle,
			eyeRadius,
			eyeColor,
			logoPaddingStyle
		} = dataDefaulted;

    // TODO: auto adjust size maybe based on size of string?
		const size = dataDefaulted.size;
		const quietZone = dataDefaulted.quietZone;
		const logoWidth = dataDefaulted.logoWidth ? dataDefaulted.logoWidth : 0;
		const logoHeight = dataDefaulted.logoHeight ? dataDefaulted.logoHeight : 0;
		const logoPadding = dataDefaulted.logoPadding ? dataDefaulted.logoPadding : 0;

		const qrCode = QrCodeGenerator(0, ecLevel);
		qrCode.addData(utf16to8(inputUrl.length > 0 ? inputUrl : value));
		qrCode.make();

		// TODO: NO as?
		const canvas = document.getElementById('qrcode-logo') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

		const canvasSize = size + 2 * quietZone;
		const length = qrCode.getModuleCount();
		const cellSize = size / length;
		const scale = window.devicePixelRatio || 1;
		canvas.height = canvas.width = canvasSize * scale;
		ctx.scale(scale, scale);

		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvasSize, canvasSize);

		const offset = quietZone;

		const positioningZones: ICoordinates[] = [
			{ row: 0, col: 0 },
			{ row: 0, col: length - 7 },
			{ row: length - 7, col: 0 }
		];

		ctx.strokeStyle = fgColor;
		if (qrStyle === 'dots') {
			ctx.fillStyle = fgColor;
			const radius = cellSize / 2;
			for (let row = 0; row < length; row++) {
				for (let col = 0; col < length; col++) {
					if (qrCode.isDark(row, col) && !isInPositioninZone(row, col, positioningZones)) {
						ctx.beginPath();
						ctx.arc(
							Math.round(col * cellSize) + radius + offset,
							Math.round(row * cellSize) + radius + offset,
							(radius / 100) * 75,
							0,
							2 * Math.PI,
							false
						);
						ctx.closePath();
						ctx.fill();
					}
				}
			}
		} else {
			for (let row = 0; row < length; row++) {
				for (let col = 0; col < length; col++) {
					if (qrCode.isDark(row, col) && !isInPositioninZone(row, col, positioningZones)) {
						ctx.fillStyle = fgColor;
						const w = Math.ceil((col + 1) * cellSize) - Math.floor(col * cellSize);
						const h = Math.ceil((row + 1) * cellSize) - Math.floor(row * cellSize);
						ctx.fillRect(
							Math.round(col * cellSize) + offset,
							Math.round(row * cellSize) + offset,
							w,
							h
						);
					}
				}
			}
		}

		// Draw positioning patterns
		for (let i = 0; i < 3; i++) {
			const { row, col } = positioningZones[i];

			let radii = eyeRadius;
			let color;

			if (Array.isArray(radii)) {
				radii = radii[i];
			}
			if (typeof radii == 'number') {
				radii = [radii, radii, radii, radii];
			}

			if (!eyeColor) {
				// if not specified, eye color is the same as foreground,
				color = fgColor;
			} else {
				if (Array.isArray(eyeColor)) {
					// if array, we pass the single color
					color = eyeColor[i];
				} else {
					color = eyeColor as EyeColor;
				}
			}

			drawPositioningPattern(ctx, cellSize, offset, row, col, color, radii as CornerRadii);
		}

		if (logoImage) {
			const image = new Image();
			if (enableCORS) {
				image.crossOrigin = 'Anonymous';
			}
			image.onload = () => {
				ctx.save();

				const dWidthLogo = logoWidth || size * 0.2;
				const dHeightLogo = logoHeight || dWidthLogo;
				const dxLogo = (size - dWidthLogo) / 2;
				const dyLogo = (size - dHeightLogo) / 2;

				if (removeQrCodeBehindLogo || logoPadding) {
					ctx.beginPath();

					ctx.strokeStyle = bgColor;
					ctx.fillStyle = bgColor;

					const dWidthLogoPadding = dWidthLogo + 2 * logoPadding;
					const dHeightLogoPadding = dHeightLogo + 2 * logoPadding;
					const dxLogoPadding = dxLogo + offset - logoPadding;
					const dyLogoPadding = dyLogo + offset - logoPadding;

					if (logoPaddingStyle === 'circle') {
						const dxCenterLogoPadding = dxLogoPadding + dWidthLogoPadding / 2;
						const dyCenterLogoPadding = dyLogoPadding + dHeightLogoPadding / 2;
						ctx.ellipse(
							dxCenterLogoPadding,
							dyCenterLogoPadding,
							dWidthLogoPadding / 2,
							dHeightLogoPadding / 2,
							0,
							0,
							2 * Math.PI
						);
						ctx.stroke();
						ctx.fill();
					} else {
						ctx.fillRect(dxLogoPadding, dyLogoPadding, dWidthLogoPadding, dHeightLogoPadding);
					}
				}

				ctx.globalAlpha = logoOpacity;
				ctx.drawImage(image, dxLogo + offset, dyLogo + offset, dWidthLogo, dHeightLogo);
				ctx.restore();
				if (logoOnLoad) {
					logoOnLoad();
				}
			};
			image.src = logoImage;
		}
	}

	function handleChange(val: string) {
		// $: {
		// inputUrl = val;
		update();
		// }
	}
</script>

<input
	bind:value={inputUrl}
	on:change={(evnt) => handleChange(evnt.currentTarget.value)}
	type="text"
/>

<canvas id="qrcode-logo" height={qrCodeSize} width={qrCodeSize} />

