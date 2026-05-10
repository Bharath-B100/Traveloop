require('dotenv').config();
const mongoose = require('mongoose');
const { City } = require('./models');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await City.updateOne({name:'Paris'},{image_url:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80'});
  await City.updateOne({name:'London'},{image_url:'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&q=80'});
  console.log('Done!');
  process.exit(0);
});
