const Stat = require('../models/Stats');

exports.getStats = async (req, res) => {
  try {
    const stats = await Stat.findAll();
    
    if (stats.length === 0) {
      console.log('📊 Stats table is empty');
      return res.json({ 
        success: true, 
        data: [],
        message: 'No stats found, table is empty' 
      });
    }
    
    console.log('📊 Found', stats.length, 'stats in database');
    res.json({ success: true, data: stats });
    
  } catch (error) {
    console.error('❌ GET STATS ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};



exports.updateStats = async (req, res) => {
  try {
    console.log('📤 UPDATE STATS REQUEST:', req.body);
    
    const updates = req.body; // array of {key, value, label}
    const results = [];
    
    for (const update of updates) {
      console.log(`🔍 Processing: ${update.key} = ${update.value}`);
      
      let stat = await Stat.findOne({ where: { key: update.key } });
      
      let formattedValue = update.value;
      const num = parseInt(update.value);
      
      // Format the value
      if (!isNaN(num)) {
        if (update.key === 'children_helped' || update.key === 'volunteers') {
          if (num >= 50) {
            const rounded = Math.floor(num / 50) * 50;
            formattedValue = `${rounded}+`;
          }
        } 
        else if (update.key === 'years_service') {
          if (num >= 5) {
            const rounded = Math.floor(num / 5) * 5;
            formattedValue = `${rounded}+`;
          }
        }
      }
      
      if (stat) {
        // Update existing stat
        console.log(`✅ Updating existing: ${update.key} = ${formattedValue}`);
        await stat.update({ 
          value: formattedValue,
          label: update.label || stat.label 
        });
        results.push(stat);
      } else {
        // Create new stat if doesn't exist
        console.log(`🆕 Creating new: ${update.key} = ${formattedValue}`);
        stat = await Stat.create({
          key: update.key,
          value: formattedValue,
          label: update.label || update.key.replace('_', ' ')
        });
        results.push(stat);
      }
    }
    
    console.log('✅ Update complete. Updated/Created:', results.length, 'stats');
    res.json({ 
      success: true, 
      message: 'Stats updated successfully',
      data: results 
    });
    
  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};