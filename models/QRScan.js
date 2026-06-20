import mongoose from 'mongoose';

const qrScanSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['QR', 'Direct'],
      default: 'QR',
    },
  },
  {
    timestamps: true,
  }
);

const QRScan = mongoose.model('QRScan', qrScanSchema);
export default QRScan;
