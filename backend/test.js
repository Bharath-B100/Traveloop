require('dotenv').config();
const mongoose = require('mongoose');
const { City } = require('./models');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await City.find({ name: { $in: ['Paris', 'London'] } });
  console.log(JSON.stringify(c, null, 2));
  process.exit(0);
});
