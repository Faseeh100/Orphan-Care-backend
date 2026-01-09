const Program = require('../models/Program');

// Get all programs (public)
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json({ success: true, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all programs (admin)
exports.getAllProgramsAdmin = async (req, res) => {
  try {
    const programs = await Program.findAll({
      order: [['order', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json({ success: true, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create program
exports.createProgram = async (req, res) => {
  try {
    const { title, description, icon, isActive, order } = req.body;
    
    const program = await Program.create({
      title,
      description,
      icon: icon || 'Education',
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    });
    
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update program
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    
    await program.update(updates);
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete program
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    
    await program.destroy();
    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};