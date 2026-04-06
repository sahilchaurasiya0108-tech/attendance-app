// Run from backend folder: node test-push.js
require('dotenv').config();
const webPush = require('web-push');
const mongoose = require('mongoose');

// Check env vars loaded
console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY ? '✅ loaded' : '❌ MISSING');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? '✅ loaded' : '❌ MISSING');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ loaded' : '❌ MISSING');

webPush.setVapidDetails(
  'mailto:admin@attendance-app.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const PushSubscription = require('./models/PushSubscription');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    const subs = await PushSubscription.find({});
    console.log(`\nFound ${subs.length} subscription(s)`);

    if (subs.length === 0) {
      console.log('\n❌ No subscriptions found. Possible reasons:');
      console.log('   1. App is running on HTTP (not HTTPS) — push requires HTTPS');
      console.log('   2. subscribeToPush() failed silently — check browser console for errors');
      console.log('   3. The POST /api/notifications/subscribe request failed — check Network tab in DevTools');
      console.log('   4. AuthContext.jsx update not deployed yet');
      console.log('\n👉 Open the app, open DevTools (F12) → Console tab, log in, and look for [PUSH] messages');
      mongoose.disconnect();
      return;
    }

    console.log('\nSending test push to all subscriptions...');
    for (const s of subs) {
      try {
        await webPush.sendNotification(
          s.subscription,
          JSON.stringify({
            title: '🔔 Test Push',
            body: 'Push notifications are working!',
            url: '/'
          })
        );
        console.log('✅ Sent to', s.subscription.endpoint.slice(0, 70) + '...');
      } catch (err) {
        console.log('❌ Failed:', err.statusCode, err.body);
      }
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });