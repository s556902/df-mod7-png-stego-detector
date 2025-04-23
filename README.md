# PNG Steganography Detector
A basic web based interface which provides a couple of tools to help detect different forms of steganography within PNG files, created with Vite + ReactJS. Files are queued, but Web Workers haven't been used, causing some hanging while files are being processed. Hosted using GitHub Pages, available at https://s556902.github.io/df-mod7-png-stego-detector/

## Functionality
- Basic Info - The tool scans the generic metadata of the image including file size, image resolution, file signature, color type, bit depth, interlacing, ancillary chunks, and how many total chunks are within the image.
- Least Significant Bits - The tool searches the least significant bits, allowing each separate channel (R/G/B/A) to be reconstructed in any combination.
- Comment Chunks - The tool searches for any comment chunks contained within the image, decompressing zTXt and iTXt chunks where necessary
- Post-IEND Data - The tool will scan for any plaintext data contained within the image which was inserted after the IEND chunk
- Image Preview - The tool contains an image previewer, which allows for normal/inverted views, as well as allowing for each channel (R/G/B/A) to be viewed, either in it's entirety, or by plane.

## Sample Images
- didyouseeit.png - https://cyberhacktics.com/deadface-ctf-2024-steganography-write-up/
- ransomwared.png - https://cybersecmaverick.medium.com/deadface-ctf-2023-steganography-e3b5a76d8e7f
- airplane.png - https://www.pexels.com/photo/modern-propellor-aircraft-parked-on-aerodome-5262799/
- desert.png - https://www.pexels.com/photo/desert-during-nighttime-847402/
- skyscraper.png - https://www.pexels.com/photo/high-rise-building-1662159/

## License Info
#### ReactJS: MIT License (Copyright (c) Meta Platforms, Inc. and affiliates.)  
#### Vite: MIT License (Copyright (c) 2019-present, VoidZero Inc. and Vite contributors)  
#### Pako: MIT License (Copyright (C) 2014-2017 by Vitaly Puzrin and Andrei Tuputcyn)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


#### FontAwesome6 Icons: CC BY 4.0 License (Copyright (c) 2024 Fonticons, Inc.)

The Font Awesome Free download is licensed under a Creative Commons
Attribution 4.0 International License and applies to all icons packaged
as SVG and JS file types. Full license available at https://creativecommons.org/licenses/by/4.0/