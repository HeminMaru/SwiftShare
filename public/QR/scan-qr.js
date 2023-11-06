import { Html5Qrcode } from 'html5-qrcode/esm/html5-qrcode';

let isModalOpen = false;
let html5Qrcode;
let onScanSuccess;

function qrboxFunction(viewfinderWidth, viewfinderHeight) {
  let minEdgePercentage = 0.7; 
  let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
  let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
  return {
    width: qrboxSize,
    height: qrboxSize
  };
}

function start() {
  html5Qrcode.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: qrboxFunction
    },
    onScanSuccessCallback,
    onScanFailure
  );
}

async function stop() {
  await html5Qrcode.stop();
}

function onScanSuccessCallback(decodedText, result) {
  isModalOpen = false;
  onScanSuccess(decodedText);
}

function onScanFailure(errorMessage, error) {}

document.querySelector('qr') .addEventListener('click', function () {
  isModalOpen = !isModalOpen;
  if (isModalOpen) {
    start();
  } else {
    stop();
  }
});

