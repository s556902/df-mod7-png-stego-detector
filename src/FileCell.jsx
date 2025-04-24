import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaRegSquare, FaRegSquareCheck } from "react-icons/fa6";
import ZoomableImage from './ZoomableImage';
import './FileCell.css'

const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const viewButtons = {
    'N': 'Normal',
    'I': 'Inverse',
    'R': 'Red',
    'G': 'Green',
    'B': 'Blue',
    'A': 'Alpha',
};

const planeViews = {
    'R': true,
    'G': true,
    'B': true,
    'A': true,
}

const planeButtons = {
    '0': 'Plane 0',
    '1': 'Plane 1',
    '2': 'Plane 2',
    '3': 'Plane 3',
    '4': 'Plane 4',
    '5': 'Plane 5',
    '6': 'Plane 6',
    '7': 'Plane 7',
    'F': 'Full View',
};

const FileCell = ({ fileData, lsb, IEND, chunks, images, onDelete }) => {
    const imageRef = useRef()
    const [fileOpen, setFileOpen] = useState(false)
    const [lsbToggles, setLsbToggles] = useState({ 'r': true, 'g': true, 'b': true, 'a': false })
    const [selectedView, setSelectedView] = useState('N')
    const [selectedPlane, setSelectedPlane] = useState('F')

    const basicInfo = {
        'File Size': formatFileSize(fileData.fileSize),
        'Image Resolution': fileData.imageResolution,
        'File Signature': fileData.fileSignature,
        'Color Type': fileData.colorType,
        'Bit Depth': fileData.bitDepth,
        'Interlace Method': fileData.interlaceMethod,
        'Ancillary Chunks': fileData.ancillaryChunks,
        'Total Chunks': fileData.chunkCount
    }

    function binaryToText(binaryMessage) {
        let output = '';

        for (let i = 0; i < binaryMessage.length; i += 8) {
            const byte = binaryMessage.slice(i, i + 8);
            if (byte.length < 8) break;

            const charCode = parseInt(byte, 2);
            if (charCode === 0) break; // Stop at null terminator if any

            output += String.fromCharCode(charCode);
        }

        return output;
    }

    function rebuildBinaryMessage() {
        let binaryMessage = '';
        if (!lsb.r) return

        const maxLength = Math.max(
            lsbToggles.r ? lsb.r.length : 0,
            lsbToggles.g ? lsb.g.length : 0,
            lsbToggles.b ? lsb.b.length : 0,
            lsbToggles.a ? lsb.a.length : 0
        );

        for (let i = 0; i < maxLength; i++) {
            if (lsbToggles.r && i < lsb.r.length) binaryMessage += lsb.r[i];
            if (lsbToggles.g && i < lsb.g.length) binaryMessage += lsb.g[i];
            if (lsbToggles.b && i < lsb.b.length) binaryMessage += lsb.b[i];
            if (lsbToggles.a && i < lsb.a.length) binaryMessage += lsb.a[i];
        }

        return binaryToText(binaryMessage);
    }

    const [imageToUse, setImageToUse] = useState(images[selectedView])

    useEffect(() => {
        setImageToUse(planeViews[selectedView] ? images[selectedView][selectedPlane] : images[selectedView])
    }, [selectedView, selectedPlane]);

    return (
        <div className='cell' style={{ height: fileOpen ? '40rem' : '6rem', paddingBottom: fileOpen ? '1rem' : '0rem' }}>
            <div className='cell-upper' onClick={() => setFileOpen(!fileOpen)}>
                <div className='cell-info-text'>
                    <div className='text-filename'>{fileData.fileName}</div>
                    <div className='text-hash'>SHA256: {fileData.sha256}</div>
                </div>
                <div className=''>
                    <FaTrash className='cell-info-delete' onClick={() => onDelete()} />

                </div>
            </div>
            <div className='cell-lower'>
                <div className='cell-info'>
                    <div className='text-cell-info'>Basic Info</div>
                    <div className='cell-info-divider' />
                    {Object.keys(basicInfo).map(item => (
                        <div className='cell-info-container' key={item}>
                            <div className='text-cell-info-key'>{item}</div>
                            <div className='text-cell-info-value'>{basicInfo[item]}</div>
                        </div>
                    ))}
                    <div className='text-cell-info extra-top'>Least Significant Bits</div>
                    <div className='cell-info-divider' />
                    <div className='cell-lsb-rgba-container'>
                        <div className='cell-rgba-button' onClick={() => { setLsbToggles({ ...lsbToggles, r: !lsbToggles.r }) }}>
                            {lsbToggles.r ? <FaRegSquareCheck /> : <FaRegSquare />} R
                        </div>
                        <div className='cell-rgba-button' onClick={() => { setLsbToggles({ ...lsbToggles, g: !lsbToggles.g }) }}>
                            {lsbToggles.g ? <FaRegSquareCheck /> : <FaRegSquare />} G

                        </div>
                        <div className='cell-rgba-button' onClick={() => { setLsbToggles({ ...lsbToggles, b: !lsbToggles.b }) }}>
                            {lsbToggles.b ? <FaRegSquareCheck /> : <FaRegSquare />} B

                        </div>
                        <div className='cell-rgba-button' onClick={() => { setLsbToggles({ ...lsbToggles, a: !lsbToggles.a }) }}>
                            {lsbToggles.a ? <FaRegSquareCheck /> : <FaRegSquare />} A

                        </div>



                    </div>
                    <div className='text-cell-info-box'>{rebuildBinaryMessage()}</div>
                    <div className='text-cell-info extra-top'>Comment Chunks</div>
                    <div className='cell-info-divider' />
                    {chunks.map ? chunks.map(item => (
                        <div key={item}>
                            <div className='text-cell-info-key'>{item[0]}</div>
                            <div className='text-cell-info-box'>{item[1]}</div>
                        </div>
                    )) : <div className='text-cell-info-key'>No comment chunks available.</div>}

                    <div className='text-cell-info extra-top'>Post-IEND Data</div>
                    <div className='cell-info-divider' />
                    {IEND ?
                        <div className='text-cell-info-box'>{IEND}</div>
                        :
                        <div className='text-cell-info-key'>No data found after IEND.</div>
                    }

                </div>

                <div className='cell-image'>
                    <div className='cell-image-buttons' style={{ right: '0.75rem', top: '0.75rem' }}>
                        <button className='button-image-setting' onClick={() => { imageRef.current.handleZoom(-0.1) }}>-</button>
                        <button className='button-image-setting' onClick={() => { imageRef.current.handleZoom(0.1) }}>+</button>
                    </div>
                    <div className='cell-image-buttons' style={{ left: '0.75rem', bottom: '0.75rem' }}>
                        {Object.entries(viewButtons).map(([key, title]) => (
                            <button
                                key={key}
                                className={`button-image-setting${selectedView === key ? ' button-selected' : ''}`}
                                title={title}
                                onClick={() => setSelectedView(key)}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                    <div className='cell-image-buttons' style={{ right: '0.75rem', bottom: '0.75rem' }}>
                        <div className="cell-image-buttons" style={{ right: '0.75rem', bottom: '0.75rem' }}>
                            {Object.entries(planeButtons).map(([key, title]) => (
                                <button
                                    key={key}
                                    className={`button-image-setting${selectedPlane === key ? ' button-selected' : ''}${planeViews[selectedView] ? '' : ' button-disabled'}`}
                                    title={title}
                                    onClick={() => setSelectedPlane(key)}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ZoomableImage src={imageToUse} ref={imageRef} />
                </div>
            </div>
        </div>
    );
};

export default FileCell;
