import QrCodeGenerator from 'qrcode-generator';
import type { CornerRadii, EyeColor, ICoordinates, QrCodeProps } from './QrCode.types';
import { LogoPaddingStyles, EcValues, QrStyles, QrCodeSize } from './QrCode.constants';

const defaultProps = {
	ecLevel: 'M',
	enableCORS: false,
	size: QrCodeSize,
	quietZone: 10,
	bgColor: '#FFFFFF',
	fgColor: '#000000',
	logoOpacity: 1,
	qrStyle: QrStyles.SQUARES,
	eyeRadius: [0, 0, 0, 0] as [number, number, number, number],
	logoPaddingStyle: LogoPaddingStyles.SQUARE
} as const;

export class QrCode implements QrCodeProps {
	// Values that must be set.
	bgColor: string;
	ecLevel: (typeof EcValues)[keyof typeof EcValues];
	fgColor: string;
	logoHeight: number;
	logoOpacity: number;
	logoPadding: number;
	logoPaddingStyle: (typeof LogoPaddingStyles)[keyof typeof LogoPaddingStyles];
	logoWidth: number;
	qrStyle: (typeof QrStyles)[keyof typeof QrStyles];
	quietZone: number;
	size: number;
	value: string;

	// Values that can use the QrCodeProps type.
	enableCORS;
	eyeColor;
	eyeRadius;
	id;
	logoImage;
	logoOnLoad;
	removeQrCodeBehindLogo;
	style;

	private internalCanvas: HTMLCanvasElement = document.createElement('canvas');
	private ctx = this.internalCanvas.getContext('2d');

	get canvas() {
		return this.internalCanvas;
	}

	get dataUrl(): string {
		return this.internalCanvas.toDataURL();
	}

	constructor(data: QrCodeProps) {
		// Require defaults.
		this.bgColor = QrCode.getFormString(data.bgColor) ?? defaultProps.bgColor;
		this.ecLevel = QrCode.getEcValue(data.ecLevel) ?? defaultProps.ecLevel;
		this.fgColor = data.fgColor && data.fgColor.length > 0 ? data.fgColor : defaultProps.fgColor;
		this.logoHeight = QrCode.getFormNumber(data.logoHeight) ?? 0;
		this.logoOpacity = QrCode.getFormDouble(data.logoOpacity) ?? defaultProps.logoOpacity;
		this.logoPadding = QrCode.getFormNumber(data.logoPadding) ?? 0;
		this.logoWidth = QrCode.getFormNumber(data.logoWidth) ?? 0;
		this.quietZone = QrCode.getFormNumber(data.quietZone) ?? defaultProps.quietZone;
		this.size = QrCode.getFormNumber(data.size) ?? defaultProps.size;
		this.value = data.value;

		// Optional values
		this.enableCORS = QrCode.getFormBoolean(data.enableCORS) ?? defaultProps.enableCORS;
		this.eyeColor = data.eyeColor;
		this.eyeRadius = data.eyeRadius ?? defaultProps.eyeRadius;
		this.id = data.id;
		this.logoImage = data.logoImage;
		this.logoOnLoad = data.logoOnLoad;
		this.logoPaddingStyle =
			QrCode.getLogoPaddingValues(data.logoPaddingStyle) ?? defaultProps.logoPaddingStyle;
		this.qrStyle = QrCode.getQrStyleValues(data.qrStyle) ?? defaultProps.qrStyle;
		this.removeQrCodeBehindLogo = data.removeQrCodeBehindLogo;
		this.style = data.style;

		this.update();
	}

	private utf16to8(str: string): string {
		let out = '';
		let i: number;
		let c: number;
		const len = str.length;
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
	private drawRoundedSquare(
		lineWidth: number,
		x: number,
		y: number,
		size: number,
		color: string,
		radii: number | number[],
		fill: boolean
	) {
		if (this.ctx === null) throw new Error('Unable to make QR code');

		this.ctx.lineWidth = lineWidth;
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = color;

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

		this.ctx.beginPath();

		this.ctx.moveTo(x + rTopLeft, y);

		this.ctx.lineTo(x + size - rTopRight, y);
		if (rTopRight) this.ctx.quadraticCurveTo(x + size, y, x + size, y + rTopRight);

		this.ctx.lineTo(x + size, y + size - rBottomRight);
		if (rBottomRight)
			this.ctx.quadraticCurveTo(x + size, y + size, x + size - rBottomRight, y + size);

		this.ctx.lineTo(x + rBottomLeft, y + size);
		if (rBottomLeft) this.ctx.quadraticCurveTo(x, y + size, x, y + size - rBottomLeft);

		this.ctx.lineTo(x, y + rTopLeft);
		if (rTopLeft) this.ctx.quadraticCurveTo(x, y, x + rTopLeft, y);

		this.ctx.closePath();

		this.ctx.stroke();
		if (fill) {
			this.ctx.fill();
		}
	}

	/**
	 * Draw a single positional pattern eye.
	 */
	private drawPositioningPattern(
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
			radiiOuter = radii;
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
		this.drawRoundedSquare(lineWidth, x, y, size, colorOuter, radiiOuter, false);

		// Inner box
		size = cellSize * 3;
		y += cellSize * 2;
		x += cellSize * 2;
		this.drawRoundedSquare(lineWidth, x, y, size, colorInner, radiiInner, true);
	}
	/**
	 * Is this dot inside a positional pattern zone.
	 */
	private isInPositionInZone(col: number, row: number, zones: ICoordinates[]) {
		return zones.some(
			(zone) => row >= zone.row && row <= zone.row + 7 && col >= zone.col && col <= zone.col + 7
		);
	}

	private transformPixelLengthIntoNumberOfCells(pixelLength: number, cellSize: number) {
		return pixelLength / cellSize;
	}

	private isCoordinateInImage(
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
			const firstRowOfLogo = this.transformPixelLengthIntoNumberOfCells(dxLogo, cellSize);
			const firstColumnOfLogo = this.transformPixelLengthIntoNumberOfCells(dyLogo, cellSize);
			const logoWidthInCells = this.transformPixelLengthIntoNumberOfCells(dWidthLogo, cellSize) - 1;
			const logoHeightInCells =
				this.transformPixelLengthIntoNumberOfCells(dHeightLogo, cellSize) - 1;

			return (
				// check rows
				row >= firstRowOfLogo - numberOfCellsMargin &&
				row <= firstRowOfLogo + logoWidthInCells + numberOfCellsMargin &&
				// check cols
				col >= firstColumnOfLogo - numberOfCellsMargin &&
				col <= firstColumnOfLogo + logoHeightInCells + numberOfCellsMargin
			);
		} else {
			return false;
		}
	}

	private loadImage(url: string) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			if (this.enableCORS) {
				image.crossOrigin = 'Anonymous';
			}
			image.onload = () => {
				resolve(image);
			};

			image.onerror = (err) => reject(err);

			image.src = url;
		});
	}

	async addImage(url: string) {
		this.logoImage = url;

		const image = await this.loadImage(url);

		const logoWidth = this.logoWidth;
		const logoHeight = this.logoHeight;
		const logoPadding = this.logoPadding;
		const offset = this.quietZone;

		if (this.ctx === null) throw new Error('ctx unavailable');

		this.ctx.save();

		const dWidthLogo = logoWidth || this.size * 0.2;
		const dHeightLogo = logoHeight || dWidthLogo;
		const dxLogo = (this.size - dWidthLogo) / 2;
		const dyLogo = (this.size - dHeightLogo) / 2;

		if (this.removeQrCodeBehindLogo || logoPadding) {
			this.ctx.beginPath();

			this.ctx.strokeStyle = this.bgColor;
			this.ctx.fillStyle = this.bgColor;

			const dWidthLogoPadding = dWidthLogo + 2 * logoPadding;
			const dHeightLogoPadding = dHeightLogo + 2 * logoPadding;
			const dxLogoPadding = dxLogo + offset - logoPadding;
			const dyLogoPadding = dyLogo + offset - logoPadding;

			if (this.logoPaddingStyle === LogoPaddingStyles.CIRCLE) {
				const dxCenterLogoPadding = dxLogoPadding + dWidthLogoPadding / 2;
				const dyCenterLogoPadding = dyLogoPadding + dHeightLogoPadding / 2;
				this.ctx.ellipse(
					dxCenterLogoPadding,
					dyCenterLogoPadding,
					dWidthLogoPadding / 2,
					dHeightLogoPadding / 2,
					0,
					0,
					2 * Math.PI
				);
				this.ctx.stroke();
				this.ctx.fill();
			} else {
				this.ctx.fillRect(dxLogoPadding, dyLogoPadding, dWidthLogoPadding, dHeightLogoPadding);
			}
		}

		this.ctx.globalAlpha = this.logoOpacity;
		this.ctx.drawImage(image, dxLogo + offset, dyLogo + offset, dWidthLogo, dHeightLogo);

		// Keep the original and overlay the newly drawn image.
		this.ctx.restore();

		if (this.logoOnLoad) {
			this.logoOnLoad();
		}

		return this;
	}

	private update() {
		const qrCode = QrCodeGenerator(0, this.ecLevel);
		qrCode.addData(this.utf16to8(this.value));
		qrCode.make();

		if (this.ctx === null) throw new Error('ctx unavailable');

		const canvasSize = this.size + 2 * this.quietZone;
		const length = qrCode.getModuleCount();
		const cellSize = this.size / length;
		const scale = window.devicePixelRatio || 1;
		this.canvas.height = this.canvas.width = canvasSize * scale;
		this.ctx.scale(scale, scale);

		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, canvasSize, canvasSize);

		const offset = this.quietZone;

		const positioningZones: ICoordinates[] = [
			{ row: 0, col: 0 },
			{ row: 0, col: length - 7 },
			{ row: length - 7, col: 0 }
		];

		this.ctx.strokeStyle = this.fgColor;
		if (this.qrStyle === QrStyles.DOTS) {
			this.ctx.fillStyle = this.fgColor;
			const radius = cellSize / 2;
			for (let row = 0; row < length; row++) {
				for (let col = 0; col < length; col++) {
					if (qrCode.isDark(row, col) && !this.isInPositionInZone(row, col, positioningZones)) {
						this.ctx.beginPath();
						this.ctx.arc(
							Math.round(col * cellSize) + radius + offset,
							Math.round(row * cellSize) + radius + offset,
							(radius / 100) * 75,
							0,
							2 * Math.PI,
							false
						);
						this.ctx.closePath();
						this.ctx.fill();
					}
				}
			}
		} else {
			for (let row = 0; row < length; row++) {
				for (let col = 0; col < length; col++) {
					if (qrCode.isDark(row, col) && !this.isInPositionInZone(row, col, positioningZones)) {
						this.ctx.fillStyle = this.fgColor;
						const w = Math.ceil((col + 1) * cellSize) - Math.floor(col * cellSize);
						const h = Math.ceil((row + 1) * cellSize) - Math.floor(row * cellSize);
						this.ctx.fillRect(
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

			let radii = this.eyeRadius;
			let color;

			if (Array.isArray(radii)) {
				radii = radii[i];
			}
			if (typeof radii == 'number') {
				radii = [radii, radii, radii, radii];
			}

			if (!this.eyeColor) {
				// if not specified, eye color is the same as foreground,
				color = this.fgColor;
			} else {
				if (Array.isArray(this.eyeColor)) {
					// if array, we pass the single color
					color = this.eyeColor[i];
				} else {
					color = this.eyeColor as EyeColor;
				}
			}

			this.drawPositioningPattern(cellSize, offset, row, col, color, radii as CornerRadii);
		}
	}

	static getFormString(value: string | FormDataEntryValue | undefined | null): string | undefined {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value;
		}

		return undefined;
	}

	static getFormBoolean(
		value: boolean | FormDataEntryValue | undefined | null
	): boolean | undefined {
		if (typeof value === 'string') {
			return value === 'on';
		}

		if (typeof value === 'boolean') {
			return value;
		}

		return undefined;
	}

	static getFormNumber(value: number | FormDataEntryValue | undefined | null): number | undefined {
		if (typeof value === 'string') {
			const tmpValue = parseInt(value);
			if (!isNaN(tmpValue) && tmpValue >= 0) {
				return tmpValue;
			}
		} else if (typeof value === 'number') {
			if (!isNaN(value) && value >= 0) {
				return value;
			}
		}

		return undefined;
	}

	static getFormDouble(value: number | FormDataEntryValue | undefined | null): number | undefined {
		if (typeof value === 'string') {
			const tmpValue = parseFloat(value);
			if (!isNaN(tmpValue) && tmpValue >= 0) {
				return tmpValue;
			}
		} else if (typeof value === 'number') {
			if (!isNaN(value) && value >= 0) {
				return value;
			}
		}

		return undefined;
	}

	static getEcValue(value: FormDataEntryValue | null | QrCodeProps['ecLevel']) {
		const found = Object.values(EcValues).find((val) => val === value);

		return found;
	}

	static getLogoPaddingValues(value: FormDataEntryValue | null | QrCodeProps['logoPaddingStyle']) {
		const found = Object.values(LogoPaddingStyles).find((val) => val === value);

		return found;
	}

	static getQrStyleValues(value: FormDataEntryValue | null | QrCodeProps['qrStyle']) {
		const found = Object.values(QrStyles).find((val) => val === value);

		return found;
	}
}
