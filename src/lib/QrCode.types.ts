import type { EcValues, LogoPaddingStyles, QrStyles } from './QrCode.constants';

export type EyeColor = string | InnerOuterEyeColor;
type InnerOuterEyeColor = {
	inner: string;
	outer: string;
};

type InnerOuterRadii = {
	inner: number | [number, number, number, number];
	outer: number | [number, number, number, number];
};
export type CornerRadii = number | [number, number, number, number] | InnerOuterRadii;

export type ICoordinates = {
	row: number;
	col: number;
};

export type QrCodeProps = {
	/**
	 * The value encoded in the QR Code.
	 * When the QR Code is decoded, this value will be returned.
	 */
	value: string;
	/**
	 * The error correction level of the QR Code.
	 */
	ecLevel?: (typeof EcValues)[keyof typeof EcValues];
	enableCORS?: boolean;
	/**
	 * The size of the QR Code.
	 */
	size?: number;
	bgColor?: string;
	fgColor?: string;
	/**
	 * The size of the quiet zone around the QR Code.
	 * This will have the same color as QR Code bgColor.
	 */
	quietZone?: number;
	/**
	 * The logo image. It can be a url/path or a base64 value.
	 */
	logoImage?: string;
	logoWidth?: number;
	logoHeight?: number;
	logoOpacity?: number;
	/**
	 * Callback function to know when the logo in the QR Code is loaded.
	 */
	logoOnLoad?: () => void;
	/**
	 * Removes points behind the logo. If no logoPadding is
	 * specified, the removed part will have the same size as the logo.
	 */
	removeQrCodeBehindLogo?: boolean;
	/**
	 * Adds a border with no points around the logo. When > 0,
	 * the padding will be visible even if the prop removeQrCodeBehindLogo
	 * is not set to true.
	 */
	logoPadding?: number;
	/**
	 * Sets the shape of the padding area around the logo.
	 */
	logoPaddingStyle?: (typeof LogoPaddingStyles)[keyof typeof LogoPaddingStyles];
	/**
	 * The corner radius for the positional patterns (the three "eyes"
	 * around the QR code).
	 *  https://github.com/gcoro/react-qrcode-logo/blob/master/res/eyeRadius_doc.md
	 */
	eyeRadius?: CornerRadii | [CornerRadii, CornerRadii, CornerRadii];
	/**
	 * The color for the positional patterns (the three "eyes" around the QR code).
	 * https://github.com/gcoro/react-qrcode-logo/blob/master/res/eyeColor_doc.md
	 */
	eyeColor?: EyeColor | [EyeColor, EyeColor, EyeColor];
	/**
	 * Style of the QR Code modules (items tha make up the qr code).
	 */
	qrStyle?: (typeof QrStyles)[keyof typeof QrStyles];
	style?: object;
	id?: string;
};
