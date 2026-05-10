const express = require('express');
const { Trip, Stop, City } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/trips - List user's trips with summary
router.get('/', authenticate, async (req, res) => {
  try {
    const trips = await Trip.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    
    for (const trip of trips) {
      trip.id = trip._id;
      const stops = await Stop.find({ trip_id: trip._id }).populate('city_id').sort({ order_index: 1 }).lean();
      trip.stop_count = stops.length;
      trip.cities = stops.map(s => s.city_id && s.city_id.name).filter(Boolean).join(', ');
    }
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/trips - Create new trip
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, start_date, end_date, cover_photo } = req.body;
    if (!name) return res.status(400).json({ error: 'Trip name is required' });

    const trip = await Trip.create({
      user_id: req.user.id,
      name,
      description: description || '',
      start_date: start_date || null,
      end_date: end_date || null,
      cover_photo: cover_photo || ''
    });

    const tripObj = trip.toObject();
    tripObj.id = tripObj._id;
    res.status(201).json(tripObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/trips/:id - Get trip with full details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user_id: req.user.id }).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    trip.id = trip._id;

    const stops = await Stop.find({ trip_id: trip._id }).sort({ order_index: 1 }).lean();
    for (const stop of stops) {
      stop.id = stop._id;
      const city = await City.findById(stop.city_id).lean();
      if (city) {
        stop.city_name = city.name;
        stop.country = city.country;
        stop.city_image = city.image_url;
        stop.cost_index = city.cost_index;
      }
      
      const { StopActivity } = require('../models');
      const stopActivities = await StopActivity.find({ stop_id: stop._id }).populate('activity_id').sort({ planned_date: 1, planned_time: 1 }).lean();
      
      stop.activities = stopActivities.map(sa => {
        const act = sa.activity_id || {};
        return {
          id: sa._id,
          stop_id: sa.stop_id,
          activity_id: act._id,
          planned_date: sa.planned_date,
          planned_time: sa.planned_time,
          custom_notes: sa.custom_notes,
          name: act.name,
          type: act.type,
          description: act.description,
          cost: act.cost,
          duration_hours: act.duration_hours,
          image_url: act.image_url
        };
      });
    }

    res.json({ ...trip, stops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/trips/:id - Update trip
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, start_date, end_date, cover_photo } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (cover_photo !== undefined) updateData.cover_photo = cover_photo;

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      updateData,
      { new: true }
    ).lean();

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    trip.id = trip._id;
    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/trips/:id - Delete trip
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Cascade deletes
    const { Stop, StopActivity, PackingItem, TripNote } = require('../models');
    const stops = await Stop.find({ trip_id: trip._id });
    const stopIds = stops.map(s => s._id);
    await StopActivity.deleteMany({ stop_id: { $in: stopIds } });
    await Stop.deleteMany({ trip_id: trip._id });
    await PackingItem.deleteMany({ trip_id: trip._id });
    await TripNote.deleteMany({ trip_id: trip._id });

    res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
