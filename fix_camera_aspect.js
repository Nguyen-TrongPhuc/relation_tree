const fs = require('fs');

let c = fs.readFileSync('src/components/locket/LiveCameraModal.tsx', 'utf8');

// Update UI to be 3:4 container
c = c.replace(
  '<div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">',
  '<div className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">'
);

// Update canvas capture logic to crop to 3:4
const captureLogicOld = `    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);`;

const captureLogicNew = `    const targetRatio = 3 / 4;
    const videoRatio = video.videoWidth / video.videoHeight;
    
    let drawWidth = video.videoWidth;
    let drawHeight = video.videoHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > targetRatio) {
      drawWidth = video.videoHeight * targetRatio;
      offsetX = (video.videoWidth - drawWidth) / 2;
    } else {
      drawHeight = video.videoWidth / targetRatio;
      offsetY = (video.videoHeight - drawHeight) / 2;
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight, 0, 0, drawWidth, drawHeight);`;

if (c.includes('canvas.width = video.videoWidth;')) {
  c = c.replace(captureLogicOld, captureLogicNew);
  // Also try CRLF replacement if the first failed
  const captureLogicOldCRLF = captureLogicOld.replaceAll('\n', '\r\n');
  if (c.includes(captureLogicOldCRLF)) {
      c = c.replace(captureLogicOldCRLF, captureLogicNew);
  }
}

fs.writeFileSync('src/components/locket/LiveCameraModal.tsx', c, 'utf8');
