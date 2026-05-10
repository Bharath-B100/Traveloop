require('dotenv').config();
require('../config/db');
const bcrypt = require('bcryptjs');
const { User, City, Activity, Trip, Stop } = require('../models');
const mongoose = require('mongoose');

async function seed() {
  console.log('Clearing database...');
  await User.deleteMany({});
  await City.deleteMany({});
  await Activity.deleteMany({});
  await Trip.deleteMany({});
  await Stop.deleteMany({});

  console.log('Seeding Users...');
  const hash = await bcrypt.hash('password123', 10);
  const admin = await User.create({ name: 'Admin User', email: 'admin@traveloop.com', password_hash: hash, role: 'admin' });
  const demoUser = await User.create({ name: 'Demo Traveler', email: 'demo@traveloop.com', password_hash: hash, role: 'user' });

  console.log('Seeding Cities...');
  const citiesData = [
    { name: 'Paris', country: 'France', region: 'Europe', image_url: 'https://images.unsplash.com/photo-1502602881462-f22f284cb15c?w=400', cost_index: 3.2, popularity: 95, description: 'City of light' },
    { name: 'Tokyo', country: 'Japan', region: 'Asia', image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', cost_index: 3.8, popularity: 92, description: 'Neon metropolis' },
    { name: 'New York', country: 'USA', region: 'North America', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', cost_index: 4.5, popularity: 90, description: 'The big apple' },
    { name: 'London', country: 'UK', region: 'Europe', image_url: 'https://images.unsplash.com/photo-1513635269975-59693e2d8ce2?w=400', cost_index: 4.1, popularity: 88, description: 'Historic capital' },
    { name: 'Rome', country: 'Italy', region: 'Europe', image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', cost_index: 2.9, popularity: 86, description: 'Eternal city' },
    { name: 'Barcelona', country: 'Spain', region: 'Europe', image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', cost_index: 2.7, popularity: 85, description: 'Gaudi architecture' },
    { name: 'Dubai', country: 'UAE', region: 'Middle East', image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', cost_index: 4.0, popularity: 84, description: 'Luxury in the desert' },
    { name: 'Bali', country: 'Indonesia', region: 'Asia', image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', cost_index: 1.8, popularity: 83, description: 'Island paradise' },
    { name: 'Istanbul', country: 'Turkey', region: 'Europe', image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400', cost_index: 2.2, popularity: 80, description: 'Where East meets West' },
    { name: 'Bangkok', country: 'Thailand', region: 'Asia', image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400', cost_index: 1.5, popularity: 79, description: 'Street food capital' }
  ];
  
  const insertedCities = await City.insertMany(citiesData);
  const cityMap = {};
  insertedCities.forEach(c => cityMap[c.name] = c._id);

  console.log('Seeding Activities...');
  const actData = [
    { city_id: cityMap['Paris'], name: 'Eiffel Tower Visit', type: 'sightseeing', description: 'Iconic iron lattice tower', cost: 25, duration_hours: 2.5, image_url: '' },
    { city_id: cityMap['Paris'], name: 'Louvre Museum', type: 'culture', description: 'World-famous art museum', cost: 17, duration_hours: 3, image_url: '' },
    { city_id: cityMap['Paris'], name: 'Seine River Cruise', type: 'sightseeing', description: 'Scenic boat ride', cost: 15, duration_hours: 1.5, image_url: '' },
    { city_id: cityMap['Tokyo'], name: 'Shibuya Crossing', type: 'sightseeing', description: 'World busiest pedestrian crossing', cost: 0, duration_hours: 1, image_url: '' },
    { city_id: cityMap['Tokyo'], name: 'Tsukiji Outer Market', type: 'food', description: 'Fresh sushi and street food', cost: 30, duration_hours: 2, image_url: '' },
    { city_id: cityMap['New York'], name: 'Statue of Liberty', type: 'sightseeing', description: 'Iconic monument', cost: 24, duration_hours: 3, image_url: '' },
    { city_id: cityMap['London'], name: 'British Museum', type: 'culture', description: 'Vast collection of world art', cost: 0, duration_hours: 4, image_url: '' },
    { city_id: cityMap['Rome'], name: 'Colosseum', type: 'sightseeing', description: 'Ancient gladiatorial arena', cost: 18, duration_hours: 2, image_url: '' }
  ];
  await Activity.insertMany(actData);

  console.log('Seeding Demo Trip...');
  const trip = await Trip.create({
    user_id: demoUser._id,
    name: 'European Adventure',
    description: 'A 10-day trip across Europe',
    start_date: '2026-06-01',
    end_date: '2026-06-10'
  });

  await Stop.insertMany([
    { trip_id: trip._id, city_id: cityMap['Paris'], arrival_date: '2026-06-01', departure_date: '2026-06-04', order_index: 1, transport_cost: 250, accommodation_cost: 150, meal_cost_per_day: 50 },
    { trip_id: trip._id, city_id: cityMap['Rome'], arrival_date: '2026-06-04', departure_date: '2026-06-07', order_index: 2, transport_cost: 120, accommodation_cost: 100, meal_cost_per_day: 40 },
    { trip_id: trip._id, city_id: cityMap['London'], arrival_date: '2026-06-07', departure_date: '2026-06-10', order_index: 3, transport_cost: 100, accommodation_cost: 120, meal_cost_per_day: 45 }
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('   Admin: admin@traveloop.com / password123');
  console.log('   Demo:  demo@traveloop.com / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
