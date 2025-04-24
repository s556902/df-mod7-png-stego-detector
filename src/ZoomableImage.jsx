import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";

const ZoomableImage = forwardRef(({ src }, ref) => {
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentImage, setCurrentImage] = useState('')

    useImperativeHandle(ref, () => ({
        handleZoom: (diff) => {
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const mouseX = rect.width/2;
            const mouseY = rect.height/2;

            const newScale = Math.max(0.1, scale + diff);
            const scaleRatio = newScale / scale;

            const rawX = mouseX - scaleRatio * (mouseX - translate.x);
            const rawY = mouseY - scaleRatio * (mouseY - translate.y);

            const imageWidth = imageRef.current.naturalWidth * newScale;
            const imageHeight = imageRef.current.naturalHeight * newScale;

            const clamped = getCenteredOrClampedTranslate(
                rawX,
                rawY,
                imageWidth,
                imageHeight,
                rect.width,
                rect.height
            );

            setScale(newScale);
            setTranslate(clamped);
        },
        setImage: (image) => {
            setCurrentImage(image)
        }
    }));

    const getCenteredOrClampedTranslate = (
        x,
        y,
        imageWidth,
        imageHeight,
        containerWidth,
        containerHeight
    ) => {
        const centeredX = (containerWidth - imageWidth) / 2;
        const centeredY = (containerHeight - imageHeight) / 2;

        const clampedX =
            imageWidth < containerWidth
                ? centeredX
                : Math.min(0, Math.max(containerWidth - imageWidth, x));
        const clampedY =
            imageHeight < containerHeight
                ? centeredY
                : Math.min(0, Math.max(containerHeight - imageHeight, y));

        return { x: clampedX, y: clampedY };
    };

    const fitImageToContainer = () => {
        const container = containerRef.current;
        const image = imageRef.current;

        if (!container || !image || image.naturalWidth === 0) return;

        const containerRect = container.getBoundingClientRect();
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        const scaleX = containerRect.width / imageWidth;
        const scaleY = containerRect.height / imageHeight;
        const fittingScale = Math.min(scaleX, scaleY);

        const fittedWidth = imageWidth * fittingScale;
        const fittedHeight = imageHeight * fittingScale;

        const offsetX = (containerRect.width - fittedWidth) / 2;
        const offsetY = (containerRect.height - fittedHeight) / 2;

        setScale(fittingScale);
        setTranslate({ x: offsetX, y: offsetY });
    };

    useEffect(() => {
        const img = imageRef.current;

        if (!img) return;
        if (img.complete) {
            fitImageToContainer();
        } else {
            img.onload = fitImageToContainer;
        }
    }, [currentImage]);

    // 🔍 ResizeObserver: monitor parent container size
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            fitImageToContainer();
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleWheel = (e) => {
        e.preventDefault();

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.max(0.1, scale + direction * zoomIntensity);
        const scaleRatio = newScale / scale;

        const rawX = mouseX - scaleRatio * (mouseX - translate.x);
        const rawY = mouseY - scaleRatio * (mouseY - translate.y);

        const imageWidth = imageRef.current.naturalWidth * newScale;
        const imageHeight = imageRef.current.naturalHeight * newScale;

        const clamped = getCenteredOrClampedTranslate(
            rawX,
            rawY,
            imageWidth,
            imageHeight,
            rect.width,
            rect.height
        );

        setScale(newScale);
        setTranslate(clamped);
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setStartPos({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const imageWidth = imageRef.current.naturalWidth * scale;
        const imageHeight = imageRef.current.naturalHeight * scale;

        const rawX = e.clientX - startPos.x;
        const rawY = e.clientY - startPos.y;

        const clamped = getCenteredOrClampedTranslate(
            rawX,
            rawY,
            imageWidth,
            imageHeight,
            rect.width,
            rect.height
        );

        setTranslate(clamped);
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                overflow: "hidden",
                width: "100%",
                height: "100%",
                position: "relative",
                cursor: isDragging ? "grabbing" : "grab",
            }}
        >
            <img
                ref={imageRef}
                src={src}
                alt=""
                style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: "top left",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
                draggable={false}
            />
        </div>
    );
});

export default ZoomableImage;
