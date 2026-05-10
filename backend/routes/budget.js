const express = require('express');
const { Trip, Stop, StopActivity, Activity } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/trips/:id/budget
router.get('/:id/budget', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const stops = await Stop.find({ trip_id: trip._id }).populate('city_id').sort({ order_index: 1 }).lean();

    let totalTransport = 0, totalAccommodation = 0, totalActivities = 0, totalMeals = 0;
    const stopBreakdowns = [];

    for (const stop of stops) {
      stop.id = stop._id;
      const stopActs = await StopActivity.find({ stop_id: stop._id }).populate('activity_id').lean();
      
      const actCost = stopActs.reduce((sum, sa) => {
        const cost = sa.activity_id && sa.activity_id.cost ? sa.activity_id.cost : 0;
        return sum + cost;
      }, 0);

      const days = stop.arrival_date && stop.departure_date
        ? Math.max(1, Math.ceil((new Date(stop.departure_date) - new Date(stop.arrival_date)) / 86400000))
        : 1;
      const mealCost = (stop.meal_cost_per_day || 30) * days;

      totalTransport += stop.transport_cost || 0;
      totalAccommodation += stop.accommodation_cost || 0;
      totalActivities += actCost;
      totalMeals += mealCost;

      stopBreakdowns.push({
        stop_id: stop._id, 
        city_name: stop.city_id ? stop.city_id.name : 'Unknown City', 
        days,
        transport: stop.transport_cost || 0,
        accommodation: stop.accommodation_cost || 0,
        activities: actCost, 
        meals: mealCost,
        total: (stop.transport_cost || 0) + (stop.accommodation_cost || 0) + actCost + mealCost
      });
    }

    const total = totalTransport + totalAccommodation + totalActivities + totalMeals;
    const totalDays = stopBreakdowns.reduce((s, b) => s + b.days, 0) || 1;

    res.json({
      total, average_per_day: Math.round(total / totalDays),
      breakdown: { transport: totalTransport, accommodation: totalAccommodation, activities: totalActivities, meals: totalMeals },
      stops: stopBreakdowns
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
