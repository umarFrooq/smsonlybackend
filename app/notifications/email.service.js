const { sendEmail } = require('../auth/email.service');

/**
 * Send exam announcement email
 * @param {string} to
 * @param {Object} exam
 * @returns {Promise}
 */
const sendExamAnnouncementEmail = async (to, exam) => {
  // Be defensive: exam may be populated differently depending on where it's called from.
  const examName = (exam && (exam.name || exam.title)) || 'Exam';
  const session = (exam && (exam.session || exam.year)) || '';

  // Resolve grade display: exam may have `allGrades`, `gradeIds` (array), or a populated `gradeId` object.
  let gradeDisplay = 'N/A';
  try {
    if (exam && exam.allGrades) {
      gradeDisplay = 'All Grades';
    } else if (exam && Array.isArray(exam.gradeIds) && exam.gradeIds.length) {
      // gradeIds may be array of ids or populated objects
      const names = exam.gradeIds.map(g => {
        if (!g) return '';
        if (typeof g === 'object') return g.title || g.name || String(g._id || g.id || '');
        return String(g);
      }).filter(Boolean);
      gradeDisplay = names.length ? names.join(', ') : String(exam.gradeIds);
    } else if (exam && exam.gradeId && typeof exam.gradeId === 'object') {
      gradeDisplay = exam.gradeId.title || exam.gradeId.name || String(exam.gradeId._id || exam.gradeId.id || 'N/A');
    } else if (exam && exam.gradeId) {
      gradeDisplay = String(exam.gradeId);
    }
  } catch (e) {
    gradeDisplay = 'N/A';
  }

  const subject = `Exam Announcement: ${examName}`;
  const text = `Dear student/parent,

This is to inform you that the following exam has been announced:

Exam: ${examName}
Grade: ${gradeDisplay}
Session: ${session}

The date sheet will be shared with you shortly.

Regards,
School Administration`;

  await sendEmail(to, subject, text);
};

/**
 * Send result announcement email
 * @param {string} to
 * @param {Object} result
 * @param {Object} student
 * @returns {Promise}
 */
const sendResultAnnouncementEmail = async (to, result, student) => {
  const examName = result && result.examId && (result.examId.name || result.examId.title) || (result && result.examName) || 'Exam';
  const studentName = student && (student.fullname || student.name) || 'Student';
  const subject = `Result Announcement: ${examName}`;
  const text = `Dear ${studentName},

The result for the following exam has been announced:

Exam: ${examName}

You can view your result by logging into the school portal.

Regards,
School Administration`;
  await sendEmail(to, subject, text);
};

module.exports = {
    sendExamAnnouncementEmail,
    sendResultAnnouncementEmail,
};
