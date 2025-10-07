import DoseLog from "../Models/doseLogModel.js";

export const createDoseLogsForMedicine = async (medicine, userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Create logs for next 30 days
  
  // Use medicine end date if it's sooner
  if (medicine.endDate && new Date(medicine.endDate) < endDate) {
    endDate.setTime(new Date(medicine.endDate).getTime());
  }
  
  const logs = [];
  
  for (let date = new Date(Math.max(today, new Date(medicine.startDate))); 
       date <= endDate; 
       date.setDate(date.getDate() + 1)) {
    
    // Check if medicine should be taken on this day
    if (shouldCreateLog(medicine, date)) {
      for (const timeStr of medicine.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date(date);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Only create future logs
        if (scheduledTime > new Date()) {
          logs.push({
            userId,
            medicineId: medicine._id,
            scheduledTime,
            status: 'pending',
            dayOfWeek: scheduledTime.getDay(),
            hour: scheduledTime.getHours()
          });
        }
      }
    }
  }
  
  // Bulk create dose logs
  if (logs.length > 0) {
    await DoseLog.insertMany(logs, { ordered: false }).catch(err => {
      // Ignore duplicate key errors
      if (err.code !== 11000) throw err;
    });
    console.log(`✅ Created ${logs.length} dose logs for ${medicine.medicineName}`);
  }
};

const shouldCreateLog = (medicine, date) => {
  if (medicine.frequency === 'daily') return true;
  
  if (medicine.frequency === 'weekly') {
    const startDay = new Date(medicine.startDate).getDay();
    const checkDay = date.getDay();
    return startDay === checkDay;
  }
  
  // Don't create logs for as-needed medicines
  if (medicine.frequency === 'as-needed') return false;
  
  return true;
};