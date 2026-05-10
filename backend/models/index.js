const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  photo_url: String,
  language: String,
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now }
});

const tripSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  start_date: String,
  end_date: String,
  cover_photo: String,
  share_token: String,
  is_public: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const citySchema = new mongoose.Schema({
  name: String,
  country: String,
  region: String,
  image_url: String,
  cost_index: Number,
  popularity: Number,
  description: String
});

const activitySchema = new mongoose.Schema({
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  name: String,
  type: String,
  description: String,
  cost: Number,
  duration_hours: Number,
  image_url: String
});

const stopSchema = new mongoose.Schema({
  trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  arrival_date: String,
  departure_date: String,
  order_index: Number,
  transport_cost: { type: Number, default: 0 },
  accommodation_cost: { type: Number, default: 0 },
  meal_cost_per_day: { type: Number, default: 0 }
});

const stopActivitySchema = new mongoose.Schema({
  stop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  planned_date: String,
  planned_time: String,
  custom_notes: String
});

const packingItemSchema = new mongoose.Schema({
  trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  name: String,
  category: String,
  is_packed: { type: Boolean, default: false }
});

const tripNoteSchema = new mongoose.Schema({
  trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  stop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: false },
  title: String,
  content: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Trip: mongoose.model('Trip', tripSchema),
  City: mongoose.model('City', citySchema),
  Activity: mongoose.model('Activity', activitySchema),
  Stop: mongoose.model('Stop', stopSchema),
  StopActivity: mongoose.model('StopActivity', stopActivitySchema),
  PackingItem: mongoose.model('PackingItem', packingItemSchema),
  TripNote: mongoose.model('TripNote', tripNoteSchema)
};
