import React from "react";

const hexToRgb = (hex) => {
	let h = String(hex || "").replace("#", "").trim();

	if (h.length === 3) {
        h = h.split("").map(c => c + c).join("");
	}

	if (h.length !== 6) {
        return { r: 59, g: 130, b: 246 };
	}

	const num = parseInt(h, 16);

	return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

const yiqLuma = ({ r, g, b }) => (r * 299 + g * 587 + b * 114) / 1000;

const getReadableTextColor = (hex) => {
	const yiq = yiqLuma(hexToRgb(hex));
	return yiq >= 140 ? "#111827" : "#FFFFFF";
};

export function WalletBadge({ children, color }) {
	const rgb = hexToRgb(color);
	const yiq = yiqLuma(rgb);
	const textColor = getReadableTextColor(color);
	const isVeryLight = yiq >= 220;

	return (
		<span
			className={"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"}
			style={{
				backgroundColor: color,
				color: textColor,
				border: isVeryLight ? "1px solid rgba(17,24,39,0.12)" : "1px solid transparent", // leve contorno no claro
			}}
		>
			{children}
		</span>
	);
}
