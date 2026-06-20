import mongoose from 'mongoose';

const qrScanSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    source: {
      type: String,
      default: 'QR',
    },
  },
  {
    timestamps: true,
  }
);

const QRScan = mongoose.model('QRScan', qrScanSchema);
export default QRScan;
