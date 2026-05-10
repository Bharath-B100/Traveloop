const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Trip, Stop, StopActivity, User, City, Activity } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /api/trips/:id/share - Generate/toggle share
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    let shareToken = trip.share_token;
    if (!shareToken) {
      shareToken = uuidv4();
      trip.share_token = shareToken;
      trip.is_public = true;
    } else {
      trip.is_public = !trip.is_public;
    }
    
    await trip.save();
    res.json({ share_token: trip.share_token, is_public: trip.is_public });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

// GET /api/shared/:token - Public trip view
router.get('/:token', async (req, res) => {
  try {
    const trip = await Trip.findOne({ share_token: req.params.token, is_public: true }).populate('user_id').lean();
    if (!trip) return res.status(404).json({ error: 'Shared trip not found' });
    
    trip.id = trip._id;
    trip.author_name = trip.user_id ? trip.user_id.name : 'Unknown';

    const stops = await Stop.find({ trip_id: trip._id }).populate('city_id').sort({ order_index: 1 }).lean();

    for (const stop of stops) {
      stop.id = stop._id;
      if (stop.city_id) {
        stop.city_name = stop.city_id.name;
        stop.country = stop.city_id.country;
        stop.city_image = stop.city_id.image_url;
        stop.city_id = stop.city_id._id;
      }

      const activities = await StopActivity.find({ stop_id: stop._id }).populate('activity_id').sort({ planned_date: 1, planned_time: 1 }).lean();
      stop.activities = activities.map(sa => {
        const act = sa.activity_id || {};
        return {
          id: sa._id,
          stop_id: sa.stop_id,
          activity_id: act._id,
          planned_date: sa.planned_date,
          planned_time: sa.planned_time,
          name: act.name,
          type: act.type,
          cost: act.cost,
          duration_hours: act.duration_hours
        };
      });
    }

    res.json({ ...trip, stops });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

// POST /api/shared/:token/copy - Copy trip
router.post('/:token/copy', authenticate, async (req, res) => {
  try {
    const source = await Trip.findOne({ share_token: req.params.token, is_public: true });
    if (!source) return res.status(404).json({ error: 'Trip not found' });

    const newTrip = await Trip.create({
      user_id: req.user.id,
      name: source.name + ' (Copy)',
      description: source.description,
      start_date: source.start_date,
      end_date: source.end_date
    });

    const stops = await Stop.find({ trip_id: source._id }).sort({ order_index: 1 });
    for (const stop of stops) {
      const newStop = await Stop.create({
        trip_id: newTrip._id,
        city_id: stop.city_id,
        arrival_date: stop.arrival_date,
        departure_date: stop.departure_date,
        order_index: stop.order_index,
        transport_cost: stop.transport_cost,
        accommodation_cost: stop.accommodation_cost,
        meal_cost_per_day: stop.meal_cost_per_day
      });

      const acts = await StopActivity.find({ stop_id: stop._id });
      for (const act of acts) {
        await StopActivity.create({
          stop_id: newStop._id,
          activity_id: act.activity_id,
          planned_date: act.planned_date,
          planned_time: act.planned_time,
          custom_notes: act.custom_notes
        });
      }
    }

    res.status(201).json({ id: newTrip._id, message: 'Trip copied' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
