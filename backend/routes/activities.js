const express = require('express');
const { Activity, City } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, type, city_id, min_cost, max_cost } = req.query;
    let filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (city_id) filter.city_id = city_id;
    if (min_cost || max_cost) {
      filter.cost = {};
      if (min_cost) filter.cost.$gte = parseFloat(min_cost);
      if (max_cost) filter.cost.$lte = parseFloat(max_cost);
    }

    const limit = parseInt(req.query.limit) || 100;
    const activities = await Activity.find(filter).populate('city_id').sort({ name: 1 }).limit(limit).lean();
    const result = activities.map(a => ({
      ...a,
      id: a._id,
      city_name: a.city_id ? a.city_id.name : null,
      country: a.city_id ? a.city_id.country : null,
      city_id: a.city_id ? a.city_id._id : null
    }));
    
    res.json(result);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/types', async (req, res) => {
  try {
    const types = await Activity.distinct('type');
    res.json(types.sort());
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/:id', async (req, res) => {
  try {
    const a = await Activity.findById(req.params.id).populate('city_id').lean();
    if (!a) return res.status(404).json({ error: 'Activity not found' });
    
    a.id = a._id;
    a.city_name = a.city_id ? a.city_id.name : null;
    a.country = a.city_id ? a.city_id.country : null;
    a.city_id = a.city_id ? a.city_id._id : null;
    
    res.json(a);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
