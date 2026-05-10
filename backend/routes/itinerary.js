const express = require('express');
const { Trip, Stop, City, StopActivity, Activity } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/trips/:tripId/stops - Get all stops for a trip
router.get('/trips/:tripId/stops', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const stops = await Stop.find({ trip_id: req.params.tripId }).sort({ order_index: 1 }).lean();

    for (const stop of stops) {
      stop.id = stop._id;
      const city = await City.findById(stop.city_id).lean();
      if (city) {
        stop.city_name = city.name;
        stop.country = city.country;
        stop.city_image = city.image_url;
        stop.cost_index = city.cost_index;
      }

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

    res.json(stops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/trips/:tripId/stops - Add a stop
router.post('/trips/:tripId/stops', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { city_id, arrival_date, departure_date, transport_cost, accommodation_cost, meal_cost_per_day } = req.body;
    if (!city_id) return res.status(400).json({ error: 'City is required' });

    const city = await City.findById(city_id);
    if (!city) return res.status(404).json({ error: 'City not found' });

    const lastStop = await Stop.findOne({ trip_id: trip._id }).sort({ order_index: -1 });
    const order_index = lastStop ? lastStop.order_index + 1 : 1;

    let stop = await Stop.create({
      trip_id: trip._id,
      city_id,
      arrival_date: arrival_date || null,
      departure_date: departure_date || null,
      order_index,
      transport_cost: transport_cost || 0,
      accommodation_cost: accommodation_cost || 0,
      meal_cost_per_day: meal_cost_per_day || 0
    });
    
    stop = stop.toObject();
    stop.id = stop._id;
    stop.city_name = city.name;
    stop.country = city.country;
    stop.city_image = city.image_url;
    stop.cost_index = city.cost_index;
    stop.activities = [];

    res.status(201).json(stop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/stops/:id - Update stop
router.put('/stops/:id', authenticate, async (req, res) => {
  try {
    let stop = await Stop.findById(req.params.id).populate('trip_id');
    if (!stop || stop.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Stop not found' });

    const { arrival_date, departure_date, order_index, transport_cost, accommodation_cost, meal_cost_per_day } = req.body;
    
    if (arrival_date !== undefined) stop.arrival_date = arrival_date;
    if (departure_date !== undefined) stop.departure_date = departure_date;
    if (order_index !== undefined) stop.order_index = order_index;
    if (transport_cost !== undefined) stop.transport_cost = transport_cost;
    if (accommodation_cost !== undefined) stop.accommodation_cost = accommodation_cost;
    if (meal_cost_per_day !== undefined) stop.meal_cost_per_day = meal_cost_per_day;

    await stop.save();

    const city = await City.findById(stop.city_id);
    const updated = stop.toObject();
    updated.id = updated._id;
    if (city) {
      updated.city_name = city.name;
      updated.country = city.country;
      updated.city_image = city.image_url;
    }
    
    // Make sure trip_id is reverted to ObjectId string rather than populated object
    updated.trip_id = stop.trip_id._id;

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/stops/:id - Remove stop
router.delete('/stops/:id', authenticate, async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id).populate('trip_id');
    if (!stop || stop.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Stop not found' });

    await StopActivity.deleteMany({ stop_id: stop._id });
    await Stop.findByIdAndDelete(req.params.id);

    res.json({ message: 'Stop removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/stops/:id/activities - Add activity to stop
router.post('/stops/:id/activities', authenticate, async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id).populate('trip_id');
    if (!stop || stop.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Stop not found' });

    const { activity_id, planned_date, planned_time, custom_notes } = req.body;
    if (!activity_id) return res.status(400).json({ error: 'Activity is required' });

    let sa = await StopActivity.create({
      stop_id: stop._id,
      activity_id,
      planned_date: planned_date || null,
      planned_time: planned_time || '09:00',
      custom_notes: custom_notes || ''
    });

    const act = await Activity.findById(activity_id);
    const result = sa.toObject();
    result.id = result._id;
    if (act) {
      result.name = act.name;
      result.type = act.type;
      result.description = act.description;
      result.cost = act.cost;
      result.duration_hours = act.duration_hours;
      result.image_url = act.image_url;
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/stop-activities/:id - Remove activity from stop
router.delete('/stop-activities/:id', authenticate, async (req, res) => {
  try {
    const sa = await StopActivity.findById(req.params.id).populate({ path: 'stop_id', populate: { path: 'trip_id' } });
    if (!sa || sa.stop_id.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Activity assignment not found' });

    await StopActivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity removed from stop' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/trips/:tripId/reorder - Reorder stops
router.put('/trips/:tripId/reorder', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Order must be an array of stop IDs' });

    for (let i = 0; i < order.length; i++) {
      await Stop.findOneAndUpdate({ _id: order[i], trip_id: trip._id }, { order_index: i + 1 });
    }

    res.json({ message: 'Stops reordered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
