import pako from 'pako';

//ChatGPT 4o mini
export function searchIEND(arrayBuffer, setIEND) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const IEND = new TextEncoder().encode('IEND'); // 'IEND' in ASCII
    const CRC32_LENGTH = 4; // 4 bytes for the CRC32

    // Search for 'IEND' backwards in the array buffer
    let iendPosition = -1;
    for (let i = uint8Array.length - 8; i >= 0; i--) {
        if (uint8Array[i] === IEND[0] && uint8Array[i + 1] === IEND[1] &&
            uint8Array[i + 2] === IEND[2] && uint8Array[i + 3] === IEND[3]) {
            iendPosition = i;
            break;
        }
    }

    if (iendPosition === -1) {
        console.error('IEND chunk not found');
        return null;
    }

    // Check for 4 bytes of CRC32 after IEND
    const crc32Position = iendPosition + 4; // 4 bytes after 'IEND'
    const crc32Bytes = uint8Array.slice(crc32Position, crc32Position + CRC32_LENGTH);

    if (crc32Bytes.length !== CRC32_LENGTH) {
        console.error('No CRC32 found after IEND');
        return null;
    }

    // Now we can check if there's hidden data beyond the CRC32
    const hiddenDataStart = crc32Position + CRC32_LENGTH;
    const hiddenData = uint8Array.slice(hiddenDataStart);

    if (hiddenData.length > 0) {
        //setIEND(new TextDecoder().decode(hiddenData))
        return new TextDecoder().decode(hiddenData);
    } else {
        return null;

    }
}

//Claude 3.7

export function getInfo(arrayBuffer, fileName, sha256) {
    // Convert ArrayBuffer to DataView for easy byte manipulation
    const dataView = new DataView(arrayBuffer);
    const uint8Array = new Uint8Array(arrayBuffer);

    // Check file size
    const fileSize = arrayBuffer.byteLength;

    // Get file signature (first 8 bytes, showing 6 as requested)
    const signatureBytes = Array.from(uint8Array.slice(0, 8))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');

    // Verify it's a PNG file
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    const isPng = pngSignature.every((byte, i) => uint8Array[i] === byte);

    if (!isPng) {
        throw new Error("Not a valid PNG file");
    }

    // PNG chunks start after the signature (8 bytes)
    let offset = 8;

    // Find IHDR chunk (must be the first chunk)
    const chunkLength = dataView.getUint32(offset);
    offset += 4;

    // Check chunk type
    const chunkType = String.fromCharCode(...uint8Array.slice(offset, offset + 4));
    offset += 4;

    if (chunkType !== 'IHDR') {
        throw new Error("Invalid PNG: IHDR chunk not found where expected");
    }

    // Extract image dimensions
    const width = dataView.getUint32(offset);
    offset += 4;
    const height = dataView.getUint32(offset);
    offset += 4;

    // Extract bit depth and color type
    const bitDepth = dataView.getUint8(offset);
    offset += 1;
    const colorType = dataView.getUint8(offset);
    offset += 1;

    // Extract compression method
    const compressionMethod = dataView.getUint8(offset);
    offset += 1;

    // Extract filter method and interlace method (additional info)
    const filterMethod = dataView.getUint8(offset);
    offset += 1;
    const interlaceMethod = dataView.getUint8(offset);

    // Color type descriptions
    const colorTypeDescriptions = {
        0: "Grayscale",
        2: "RGB",
        3: "Palette",
        4: "Grayscale with Alpha",
        6: "RGB with Alpha"
    };

    // Additional analysis
    // Count number of chunks
    let chunkCount = 0;
    let hasIDAT = false;
    let ancillaryChunks = [];

    // Reset to analyze all chunks
    offset = 8;

    while (offset < fileSize) {
        const length = dataView.getUint32(offset);
        offset += 4;

        if (offset + 4 > fileSize) break;

        const type = String.fromCharCode(...uint8Array.slice(offset, offset + 4));
        offset += 4;

        // Check for IDAT chunk (image data)
        if (type === 'IDAT') {
            hasIDAT = true;
        }

        // Track ancillary chunks (non-critical)
        if (type.charAt(0) >= 'a' && type.charAt(0) <= 'z') {
            ancillaryChunks.push(type);
        }

        chunkCount++;

        // Skip chunk data and CRC
        offset += length + 4;
    }

    return {
        fileName,
        sha256,
        fileSize: fileSize,
        imageResolution: `${width} × ${height}`,
        fileSignature: signatureBytes.substring(0, 17), // First 6 bytes
        colorType: colorTypeDescriptions[colorType] || "Unknown",
        bitDepth: `${bitDepth} Bits`,
        compressionMethod,
        filterMethod,
        interlaceMethod: interlaceMethod ? "Adam7" : "None",
        chunkCount: `${chunkCount} Chunks`,
        hasImageData: hasIDAT,
        ancillaryChunks: ancillaryChunks.length > 0 ? ancillaryChunks.join(', ') : "None",
    };
}

//ChatGPT 4o mini

export function decodeChunks(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const textChunks = [];

    const isPng = (
        dataView.getUint32(0) === 0x89504E47 && // PNG signature
        dataView.getUint32(4) === 0x0D0A1A0A
    );
    if (!isPng) {
        return ('Not a valid PNG file.');
    }

    let offset = 8; // Skip PNG signature

    while (offset < dataView.byteLength) {
        const length = dataView.getUint32(offset); // 4 bytes
        const type = String.fromCharCode(
            dataView.getUint8(offset + 4),
            dataView.getUint8(offset + 5),
            dataView.getUint8(offset + 6),
            dataView.getUint8(offset + 7)
        );
        if (['tEXt', 'iTXt', 'zTXt'].includes(type)) {
            const chunkStart = offset + 8;
            const chunkEnd = chunkStart + length;
            const chunkDataBytes = new Uint8Array(arrayBuffer, chunkStart, length);
            let decodedText = '';

            if (type === 'tEXt') {
                decodedText = new TextDecoder().decode(chunkDataBytes);
                textChunks.push([type, decodedText]);
            } else if (type === 'iTXt') {
                const keywordEnd = chunkDataBytes.indexOf(0);
                const keyword = new TextDecoder().decode(chunkDataBytes.slice(0, keywordEnd));
                const compressionFlag = chunkDataBytes[keywordEnd + 1];
                const compressionMethod = chunkDataBytes[keywordEnd + 2];

                // Find positions of the next null-terminated strings (language tag, translated keyword)
                let ptr = keywordEnd + 3;
                const findNull = () => {
                    const start = ptr;
                    while (chunkDataBytes[ptr] !== 0 && ptr < chunkDataBytes.length) ptr++;
                    const result = new TextDecoder().decode(chunkDataBytes.slice(start, ptr));
                    ptr++; // move past null
                    return result;
                };

                const languageTag = findNull();
                const translatedKeyword = findNull();
                const remainingBytes = chunkDataBytes.slice(ptr);

                let textContent = '';
                if (compressionFlag === 1 && compressionMethod === 0) {
                    try {
                        const inflated = pako.inflate(remainingBytes);
                        textContent = new TextDecoder().decode(inflated);
                    } catch (e) {
                        textContent = '[Error decompressing iTXt]';
                    }
                } else {
                    textContent = new TextDecoder().decode(remainingBytes);
                }
                textChunks.push([type, `Keyword: ${keyword}, Text: ${textContent}`]);
                //textChunks.push(`iTXt: Keyword: ${keyword}, Text: ${textContent}`);
            } else if (type === 'zTXt') {
                const keywordEnd = chunkDataBytes.indexOf(0);
                const keyword = new TextDecoder().decode(chunkDataBytes.slice(0, keywordEnd));
                const compressionMethod = chunkDataBytes[keywordEnd + 1];

                const compressedText = chunkDataBytes.slice(keywordEnd + 2);
                let textContent = '';

                if (compressionMethod === 0) {
                    try {
                        const inflated = pako.inflate(compressedText);
                        textContent = new TextDecoder().decode(inflated);
                    } catch (e) {
                        textContent = '[Error decompressing zTXt chunk]';
                    }
                } else {
                    textContent = '[Unsupported compression method]';
                }
                textChunks.push([type, `Keyword: ${keyword}, Text: ${textContent}`]);
                //textChunks.push(`zTXt: Keyword: ${keyword}, Text: ${textContent}`);
            }
        }

        offset += 8 + length + 4; // Length + Type + Data + CRC
    }

    return textChunks.length ? textChunks : 'No stego chunks found.'
};

//Adapted from https://github.com/stylesuxx/steganography/blob/gh-pages/script.js

export function decodeLSB(imageData) {
    const data = imageData.data;
    const channels = {
        r: [],
        g: [],
        b: [],
        a: []
    };

    for (let i = 0; i < data.length; i += 4) {
        channels.r.push(data[i] % 2 === 0 ? '0' : '1');
        channels.g.push(data[i + 1] % 2 === 0 ? '0' : '1');
        channels.b.push(data[i + 2] % 2 === 0 ? '0' : '1');
        channels.a.push(data[i + 3] % 2 === 0 ? '0' : '1');
    }

    return channels;
}

//Claude 3.7

export function extractBitPlanes(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Create result object with all requested views
    const result = {
        N: null,      // Original image
        I: null,      // Inverted image
        R: { F: null }, // Red channel views
        G: { F: null }, // Green channel views
        B: { F: null }, // Blue channel views
        A: { F: null }  // Alpha channel views
    };

    // Initialize arrays to hold bit values
    const planeData = {
        R: Array(8).fill().map(() => []),
        G: Array(8).fill().map(() => []),
        B: Array(8).fill().map(() => []),
        A: Array(8).fill().map(() => [])
    };

    // Extract each bit plane for each channel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];       // Red
        const g = data[i + 1];   // Green
        const b = data[i + 2];   // Blue
        const a = data[i + 3];   // Alpha

        // Create bit planes for each channel
        for (let bit = 0; bit < 8; bit++) {
            planeData.R[bit].push((r >> bit) & 1);  // Changed from (7-bit) to bit to match StegSolve
            planeData.G[bit].push((g >> bit) & 1);
            planeData.B[bit].push((b >> bit) & 1);
            planeData.A[bit].push((a >> bit) & 1);
        }
    }

    // Create a single reusable canvas for rendering
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = width;
    renderCanvas.height = height;
    const renderCtx = renderCanvas.getContext("2d", { willReadFrequently: true });

    // 1. Original image (N)
    result.N = canvas.toDataURL();

    // 2. Inverted image (I)
    renderCtx.drawImage(canvas, 0, 0);
    const invImageData = renderCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < invImageData.data.length; i += 4) {
        invImageData.data[i] = 255 - invImageData.data[i];         // Invert R
        invImageData.data[i + 1] = 255 - invImageData.data[i + 1]; // Invert G
        invImageData.data[i + 2] = 255 - invImageData.data[i + 2]; // Invert B
        // Alpha remains unchanged
    }
    renderCtx.putImageData(invImageData, 0, 0);
    result.I = renderCanvas.toDataURL();

    // 3. Full channel views (now as part of each channel object)
    // Red channel only
    renderCtx.drawImage(canvas, 0, 0);
    const redChannelData = renderCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < redChannelData.data.length; i += 4) {
        redChannelData.data[i + 1] = 0; // Zero out G
        redChannelData.data[i + 2] = 0; // Zero out B
    }
    renderCtx.putImageData(redChannelData, 0, 0);
    result.R.F = renderCanvas.toDataURL();

    // Green channel only
    renderCtx.drawImage(canvas, 0, 0);
    const greenChannelData = renderCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < greenChannelData.data.length; i += 4) {
        greenChannelData.data[i] = 0;     // Zero out R
        greenChannelData.data[i + 2] = 0; // Zero out B
    }
    renderCtx.putImageData(greenChannelData, 0, 0);
    result.G.F = renderCanvas.toDataURL();

    // Blue channel only
    renderCtx.drawImage(canvas, 0, 0);
    const blueChannelData = renderCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < blueChannelData.data.length; i += 4) {
        blueChannelData.data[i] = 0;     // Zero out R
        blueChannelData.data[i + 1] = 0; // Zero out G
    }
    renderCtx.putImageData(blueChannelData, 0, 0);
    result.B.F = renderCanvas.toDataURL();

    // Alpha channel only (rendered as grayscale)
    const alphaChannelData = renderCtx.createImageData(width, height);
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        alphaChannelData.data[i] = alpha;     // R = alpha value
        alphaChannelData.data[i + 1] = alpha; // G = alpha value
        alphaChannelData.data[i + 2] = alpha; // B = alpha value
        alphaChannelData.data[i + 3] = 255;   // Full opacity
    }
    renderCtx.putImageData(alphaChannelData, 0, 0);
    result.A.F = renderCanvas.toDataURL();

    // 4. Render individual bit planes
    for (const channel of ['R', 'G', 'B', 'A']) {
        for (let bit = 0; bit < 8; bit++) {
            // Store with reversed indices to match StegSolve's order
            const targetBit = 7 - bit;

            const planeImageData = renderCtx.createImageData(width, height);
            for (let i = 0; i < planeData[channel][bit].length; i++) {
                const pixel = planeData[channel][bit][i];
                const color = pixel === 1 ? 255 : 0; // 1 is white (255), 0 is black (0)
                planeImageData.data[i * 4] = color;     // Red
                planeImageData.data[i * 4 + 1] = color; // Green
                planeImageData.data[i * 4 + 2] = color; // Blue
                planeImageData.data[i * 4 + 3] = 255;   // Alpha (fully opaque)
            }
            renderCtx.putImageData(planeImageData, 0, 0);
            result[channel][targetBit] = renderCanvas.toDataURL();
        }
    }

    return result;
}