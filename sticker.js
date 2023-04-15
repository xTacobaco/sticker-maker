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
            let outline = new ImageData(new Uint8ClampedArray(albedo.data), albedo.width, albedo.height);
            const pixels = outline.data;

            for (let i = 0; i < pixels.length; i += 4) {
                const grayscale = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
                const threshold = 170;
                if (grayscale < threshold) {
                    pixels[i + 3] = 0;
                } else {
                    pixels[i] = pixels[i + 1] = pixels[i + 2] = 256;
                }
            }

            ctx.putImageData(outline, 0, 0);
            outline = ctx.getImageData(0, 0, width, height);
            res({ albedo, outline })
        }
        img.onerror = rej;
    });
}