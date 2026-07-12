import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { getISTDateString } from '../utils/timezoneHelper.js';

export const runMigrations = async () => {
  try {
    console.log('[MIGRATION] Starting database migration check...');
    const ordersCollection = mongoose.connection.collection('orders');

    // 1. Drop old single-key unique index 'orderNumber_1'
    try {
      await ordersCollection.dropIndex('orderNumber_1');
      console.log('[MIGRATION] Successfully dropped old global unique index orderNumber_1');
    } catch (indexErr) {
      console.log('[MIGRATION] Notice: orderNumber_1 index not dropped (might not exist or already dropped)');
    }

    // 2. Drop old single-key unique index 'shopId_1' on counters collection
    try {
      const countersCollection = mongoose.connection.collection('counters');
      await countersCollection.dropIndex('shopId_1');
      console.log('[MIGRATION] Successfully dropped old unique index shopId_1 on counters collection');
    } catch (indexErr) {
      console.log('[MIGRATION] Notice: shopId_1 index on counters not dropped (might not exist or already dropped)');
    }

    // 2. Populate businessDate for existing orders where it is missing
    const missingOrders = await Order.find({ businessDate: { $exists: false } });
    if (missingOrders.length > 0) {
      console.log(`[MIGRATION] Found ${missingOrders.length} orders missing businessDate. Migrating...`);
      for (const order of missingOrders) {
        // Parse createdAt and compute business date in IST
        const dateStr = getISTDateString(order.createdAt);
        order.businessDate = dateStr;
        await order.save();
      }
      console.log('[MIGRATION] All missing businessDates populated successfully.');
    } else {
      console.log('[MIGRATION] No historical orders missing businessDate.');
    }

    // 3. Ensure the compound index is created
    await Order.createIndexes();
    console.log('[MIGRATION] Compound unique index (shopId, businessDate, orderNumber) verified successfully.');
    console.log('[MIGRATION] Database migration check completed.');
  } catch (error) {
    console.error('[MIGRATION] Error running migrations:', error);
  }
};
