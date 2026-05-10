const express = require('express');
const { User, Trip, Stop, StopActivity, City, Activity } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const totalStops = await Stop.countDocuments();
    const totalActivitiesUsed = await StopActivity.countDocuments();
    const publicTrips = await Trip.countDocuments({ is_public: true });
    
    res.json({ totalUsers, totalTrips, totalStops, totalActivitiesUsed, publicTrips });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 }).lean();
    for (const u of users) {
      u.id = u._id;
      u.trip_count = await Trip.countDocuments({ user_id: u._id });
    }
    res.json(users);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/top-cities', authenticate, requireAdmin, async (req, res) => {
  try {
    const topCities = await Stop.aggregate([
      { $group: { _id: "$city_id", usage_count: { $sum: 1 } } },
      { $sort: { usage_count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'cities', localField: '_id', foreignField: '_id', as: 'city' } },
      { $unwind: "$city" },
      { $project: { _id: 0, name: "$city.name", country: "$city.country", usage_count: 1 } }
    ]);
    res.json(topCities);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/top-activities', authenticate, requireAdmin, async (req, res) => {
  try {
    const topActivities = await StopActivity.aggregate([
      { $group: { _id: "$activity_id", usage_count: { $sum: 1 } } },
      { $sort: { usage_count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'activities', localField: '_id', foreignField: '_id', as: 'activity' } },
      { $unwind: "$activity" },
      { $lookup: { from: 'cities', localField: 'activity.city_id', foreignField: '_id', as: 'city' } },
      { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: "$activity.name", type: "$activity.type", city_name: "$city.name", usage_count: 1 } }
    ]);
    res.json(topActivities);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/trends', authenticate, requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Trip.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } }
    ]);
    res.json(trends);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
