const express = require('express');
const { City, Activity } = require('../models');

const router = express.Router();

// GET /api/cities - Search & filter cities
router.get('/', async (req, res) => {
  try {
    const { q, country, region, min_cost, max_cost, sort } = req.query;
    let filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { country: { $regex: q, $options: 'i' } }
      ];
    }
    if (country) filter.country = country;
    if (region) filter.region = region;
    
    if (min_cost || max_cost) {
      filter.cost_index = {};
      if (min_cost) filter.cost_index.$gte = parseFloat(min_cost);
      if (max_cost) filter.cost_index.$lte = parseFloat(max_cost);
    }

    let sortOpt = {};
    if (sort === 'popularity') sortOpt.popularity = -1;
    else if (sort === 'cost_asc') sortOpt.cost_index = 1;
    else if (sort === 'cost_desc') sortOpt.cost_index = -1;
    else sortOpt.popularity = -1;

    const cities = await City.find(filter).sort(sortOpt).limit(50).lean();
    cities.forEach(c => c.id = c._id);
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/cities - Add new city (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, country, region, popularity, cost_index, image_url } = req.body;
    if (!name || !country) return res.status(400).json({ error: 'Name and country are required' });
    const city = await City.create({
      name, country, region, 
      popularity: popularity || 50, 
      cost_index: cost_index || 3, 
      image_url: image_url || ''
    });
    const result = city.toObject();
    result.id = result._id;
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/cities/:id - Edit city (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, country, region, popularity, cost_index, image_url } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (country) updateData.country = country;
    if (region) updateData.region = region;
    if (popularity !== undefined) updateData.popularity = popularity;
    if (cost_index !== undefined) updateData.cost_index = cost_index;
    if (image_url) updateData.image_url = image_url;

    const city = await City.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!city) return res.status(404).json({ error: 'City not found' });
    
    const result = city.toObject();
    result.id = result._id;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cities/popular - Top popular cities
router.get('/popular', async (req, res) => {
  try {
    const cities = await City.find().sort({ popularity: -1 }).limit(12).lean();
    cities.forEach(c => c.id = c._id);
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cities/countries - List unique countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await City.distinct('country');
    res.json(countries.sort());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cities/regions - List unique regions
router.get('/regions', async (req, res) => {
  try {
    const regions = await City.distinct('region');
    res.json(regions.sort());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cities/:id - City details with activities
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id).lean();
    if (!city) return res.status(404).json({ error: 'City not found' });
    city.id = city._id;

    const activities = await Activity.find({ city_id: city._id }).sort({ type: 1, name: 1 }).lean();
    activities.forEach(a => a.id = a._id);
    city.activities = activities;
    
    res.json(city);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
