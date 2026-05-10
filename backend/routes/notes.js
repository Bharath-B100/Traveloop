const express = require('express');
const { TripNote, Trip, Stop, City } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/:tripId/notes', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const notes = await TripNote.find({ trip_id: trip._id })
      .populate({ path: 'stop_id', populate: { path: 'city_id' } })
      .sort({ created_at: -1 })
      .lean();

    const result = notes.map(n => {
      n.id = n._id;
      if (n.stop_id) {
        n.stop_order = n.stop_id.order_index;
        if (n.stop_id.city_id) n.city_name = n.stop_id.city_id.name;
        n.stop_id = n.stop_id._id; // revert populated field to string
      }
      return n;
    });

    res.json(result);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.post('/:tripId/notes', authenticate, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, user_id: req.user.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { title, content, stop_id } = req.body;
    if (!content) return res.status(400).json({ error: 'Note content is required' });

    const note = await TripNote.create({
      trip_id: trip._id,
      stop_id: stop_id || null,
      title: title || '',
      content
    });

    const noteObj = note.toObject();
    noteObj.id = noteObj._id;
    res.status(201).json(noteObj);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.put('/notes/:id', authenticate, async (req, res) => {
  try {
    const note = await TripNote.findById(req.params.id).populate('trip_id');
    if (!note || note.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Note not found' });

    const { title, content, stop_id } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (stop_id !== undefined) note.stop_id = stop_id;
    note.updated_at = new Date();

    await note.save();
    
    const updated = note.toObject();
    updated.id = updated._id;
    updated.trip_id = note.trip_id._id;
    res.json(updated);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.delete('/notes/:id', authenticate, async (req, res) => {
  try {
    const note = await TripNote.findById(req.params.id).populate('trip_id');
    if (!note || note.trip_id.user_id.toString() !== req.user.id) return res.status(404).json({ error: 'Note not found' });

    await TripNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

module.exports = router;
