const express = require('express');
const { PackingItem, Trip } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/:tripId/packing', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const items = await PackingItem.find({ trip_id: trip._id }).sort({ category: 1, name: 1 }).lean();
    items.forEach(i => i.id = i._id);
    res.json(items);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.post('/:tripId/packing', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    const item = await PackingItem.create({
      trip_id: trip._id,
      name,
      category: category || 'misc'
    });

    const itemObj = item.toObject();
    itemObj.id = itemObj._id;
    res.status(201).json(itemObj);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.put('/packing/:id', authenticate, async (req, res) => {
  try {
    const item = await PackingItem.findById(req.params.id).populate('trip_id');
    if (!item || item.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Item not found' });

    const { name, category, is_packed } = req.body;
    if (name) item.name = name;
    if (category) item.category = category;
    if (is_packed !== undefined) item.is_packed = is_packed;
    
    await item.save();
    
    const updated = item.toObject();
    updated.id = updated._id;
    updated.trip_id = updated.trip_id._id; // Restore string ref
    res.json(updated);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.delete('/packing/:id', authenticate, async (req, res) => {
  try {
    const item = await PackingItem.findById(req.params.id).populate('trip_id');
    if (!item || item.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Item not found' });

    await PackingItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.post('/:tripId/packing/reset', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await PackingItem.updateMany({ trip_id: trip._id }, { is_packed: false });
    res.json({ message: 'Checklist reset' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
