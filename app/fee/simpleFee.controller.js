const Fee = require('../../models/fee');

// Add or update monthly fee for a student (simple version)
exports.addOrUpdateFee = async (req, res) => {
  try {
    const { studentId, month, year, amount, paid } = req.body;
    // Find previous unpaid fees
    const previousFees = await Fee.find({
      studentId,
      $or: [
        { year: { $lt: year } },
        { year, month: { $lt: month } }
      ]
    });
    let arrears = 0;
    previousFees.forEach(fee => {
      const due = (fee.amount + fee.arrears) - fee.paid;
      if (due > 0) arrears += due;
    });
    // Upsert fee for this month
    const fee = await Fee.findOneAndUpdate(
      { studentId, month, year },
      { $set: { amount, paid, arrears, createdBy: req.user._id } },
      { upsert: true, new: true }
    );
    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get fee history for a student (simple version)
exports.getFeeHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const fees = await Fee.find({ studentId }).sort({ year: 1, month: 1 });
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
