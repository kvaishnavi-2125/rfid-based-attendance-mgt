const QRCode = require('qrcode');
const fs = require('fs');

const url = "https://attendify-iot.vercel.app";

// Generate a PNG file
QRCode.toFile('qr.png', url, {
  color: {
    dark: '#000',  // QR code color
    light: '#FFF'  // background
  }
}, function (err) {
  if (err) throw err;
  console.log('QR code saved as qr.png');
});
