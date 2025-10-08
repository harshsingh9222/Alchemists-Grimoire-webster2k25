import DoseLog from "../Models/doseLogModel.js";

/**
 * Fetch daily dose summary — only "taken" and "missed"
 * For today: fetches only up to the current time.
 * For past dates: fetches the full day.
 */
export const getDailyDoseSummary = async (req, res) => {
  try {
    const { userId } = req.user; // assuming authenticated middleware adds this
    const { date } = req.query; // e.g. "2025-10-07"

    if (!date) {
      return res.status(400).json({ message: "Date is required (YYYY-MM-DD)" });
    }

    // Determine date range
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);

    if (isToday) {
      // For today → fetch only until current time
      endOfDay.setHours(today.getHours(), today.getMinutes(), today.getSeconds(), 999);
    } else {
      // For past days → full day
      endOfDay.setHours(23, 59, 59, 999);
    }

    // Fetch only taken/missed logs
    const logs = await DoseLog.find({
      userId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["taken", "missed"] },
    })
      .populate("medicineId", "name dosage icon")
      .sort({ scheduledTime: 1 });

    // Group by time
    const grouped = {};

    logs.forEach((log) => {
      const timeKey = new Date(log.scheduledTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          time: timeKey,
          total: 0,
          taken: 0,
          missed: 0,
          medicines: [],
        };
      }

      grouped[timeKey].total++;
      grouped[timeKey][log.status]++;

      grouped[timeKey].medicines.push({
        id: log.medicineId?._id,
        name: log.medicineId?.name || "Unnamed Elixir",
        dosage: log.medicineId?.dosage || "",
        status: log.status,
        notes: log.notes,
      });
    });

    return res.status(200).json({
      success: true,
      date,
      isToday,
      summary: Object.values(grouped),
    });
  } catch (error) {
    console.error("Error fetching dose summary:", error);
    return res.status(500).json({ message: "Server error fetching dose summary" });
  }
};
