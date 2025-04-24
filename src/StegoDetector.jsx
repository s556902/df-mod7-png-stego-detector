import React, { useRef, useState } from 'react';
import { FaPlus, FaSpinner } from "react-icons/fa6";
import {
  decodeChunks,
  decodeLSB,
  searchIEND,
  getInfo,
  extractBitPlanes
} from './Decoders.jsx';

import './StegoDetector.css';
import FileCell from './FileCell.jsx';

const PngStegoDetector = () => {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [fileCells, setFileCells] = useState([]);

  const activeUploads = useRef(0);
  const [isProcessing, setIsProcessing] = useState(false);


  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    const fileInfo = getInfo(arrayBuffer, file.name, hexHash);
    const chunks = decodeChunks(arrayBuffer);
    const IEND = searchIEND(arrayBuffer);

    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = dataUrl;
    });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const lsb = decodeLSB(imageData);
    const images = extractBitPlanes(canvas);

    return {
      fileData: fileInfo,
      lsb,
      IEND,
      chunks,
      images
    };
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    activeUploads.current += files.length;
    setIsProcessing(true);

    for (const file of files) {
      try {
        const decoded = await processFile(file);
        setFileCells(prev => [...prev, decoded]);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      } finally {
        activeUploads.current -= 1;
        if (activeUploads.current === 0) {
          setIsProcessing(false);
        }
      }
    }
  };

  const handleDelete = (indexToDelete) => {
    setFileCells(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  return (
    <div className="main">
      <div className="main-top">
        <div className="text-heading">PNG Steganography Detector</div>
        <button className="button-upload" onClick={handleButtonClick}>
          {isProcessing ? (
            <FaSpinner className="button-uploading-icon button-upload-icon" />
          ) : (
            <FaPlus className="button-upload-icon" />
          )}
          &nbsp;Add Files
        </button>
      </div>
      <div className="main-container">
        {fileCells.map((cell, idx) => (
          <FileCell
            key={idx}
            fileData={cell.fileData}
            lsb={cell.lsb}
            IEND={cell.IEND}
            chunks={cell.chunks}
            images={cell.images}
            onDelete={() => handleDelete(idx)}
          />
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default PngStegoDetector;
