const Service = require('../models/Service');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [['created_at', 'ASC']]
    });
    
    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services'
    });
  }
};

// Get single service
exports.getService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching service'
    });
  }
};

// Create new service
exports.createService = async (req, res) => {
  try {
    const { name, description, category, icon, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }
    
    const service = await Service.create({
      name,
      description,
      category,
      icon,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating service'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    await service.update(req.body);
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating service'
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    await service.destroy();
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting service'
    });
  }
};

// Toggle service status
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    service.isActive = !service.isActive;
    await service.save();
    
    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling service status'
    });
  }
};