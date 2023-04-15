export default async function createStickerImages(url, width, height) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.willReadFrequently = true;
    var img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    return new Promise((res, rej) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            let albedo = ctx.getImageData(0, 0, width, height); // original
            let alphaMap = new ImageData(new Uint8ClampedArray(albedo.data), albedo.width, albedo.height);
            const alphaMapPixels = alphaMap.data;
            for (let i = 0; i < alphaMapPixels.length; i += 4) {
                alphaMapPixels[i] = alphaMapPixels[i + 1] = alphaMapPixels[i + 2] = alphaMapPixels[i + 3];
            }
            
            let outline = new ImageData(new Uint8ClampedArray(albedo.data), albedo.width, albedo.height);
            const outlinePixels = outline.data;
            for (let i = 0; i < outlinePixels.length; i += 4) {
                const grayscale = 0.299 * outlinePixels[i] + 0.587 * outlinePixels[i + 1] + 0.114 * outlinePixels[i + 2];
                const threshold = 170;
                if (grayscale < threshold) {
                    outlinePixels[i + 3] = 0;
                } else {
                    outlinePixels[i] = outlinePixels[i + 1] = outlinePixels[i + 2] = 256;
                }
            }

            ctx.putImageData(outline, 0, 0);
            outline = ctx.getImageData(0, 0, width, height);
            res({ albedo, outline, alphaMap })
        }
        img.onerror = rej;
    });
}