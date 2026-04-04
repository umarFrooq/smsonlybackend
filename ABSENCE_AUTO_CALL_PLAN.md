# Automated Absence Call System — Plan & Documentation

**Goal:** Automatically detect absent students, call their parents via AI-guided voice call, and persist the conversation record in MongoDB.

---

## 1. System Overview

```
[node-cron]  ──triggers──▶  [AbsenceChecker]  ──queries──▶  [MongoDB: Attendance]
                                    │
                                    ▼
                           [Build call queue]  ──saves──▶  [MongoDB: AbsenceCallLog]
                                    │
                                    ▼
                           [Twilio / SignalWire API]
                                    │
                          ┌─────────┴──────────┐
                          ▼                    ▼
                   [TTS Message]         [DTMF IVR]
                   "Hi, your child       Press 1 = aware
                    Zain was absent      Press 2 = query
                    today at..."
                          │
                          ▼
                   [Twilio webhook]  ──updates──▶  [MongoDB: AbsenceCallLog]
```

**Call flow (user experience):**
1. Parent receives a phone call
2. TTS voice says: *"Hello, this is an automated message from [School Name]. Your child [Student Name] was absent today, [Date]. Press 1 if you are aware of this absence. Press 2 to have the school call you back. Press 3 to repeat this message."*
3. Parent presses a key — system records it
4. If no answer → retry once after 30 min → mark as "no_answer" in DB
5. Full call log (timestamp, parent response, call duration) saved to DB

---

## 2. Why "Cheapest" — Cost Breakdown

| Component | Service | Cost |
|-----------|---------|------|
| Voice calls | **SignalWire** (Twilio-compatible) | ~$0.006/min outbound |
| Voice calls (alt) | **Twilio** | ~$0.014/min outbound |
| Voice calls (alt) | **Plivo** | ~$0.010/min outbound |
| Text-to-Speech | **Google Cloud TTS** (standard voice) | **FREE** up to 1M chars/month |
| Text-to-Speech (alt) | **Amazon Polly** (standard) | **FREE** 5M chars/12 months, then $4/1M |
| AI conversation logic | **IVR with DTMF** (press-1 system) | **FREE** — built into TwiML |
| Cron scheduler | `node-cron` npm package | **FREE** |
| Database | MongoDB Atlas (already in use) | **FREE** |

**Monthly cost estimate for 500-student school:**
- 10% absence rate = 50 absent students/day × 22 days = 1,100 calls/month
- Average call: 45 seconds
- SignalWire: 1,100 × $0.006 × 0.75 = **~$5/month**
- Twilio: 1,100 × $0.014 × 0.75 = **~$12/month**
- TTS: 1,100 calls × ~200 chars = 220,000 chars — well within free tier
- **Total: $5–12/month**

> **Why no full AI conversation?** Full real-time AI speech conversation (e.g. OpenAI Realtime API, Google Dialogflow CX) costs $0.06–0.24/min in audio tokens — 10–20× more expensive. For absence notification, DTMF IVR (press 1 = acknowledged) is sufficient and nearly free. AI conversation is only added if you need the parent to ask *why* or provide verbal acknowledgment.

---

## 3. Recommended Tech Stack

```
node-cron                → Schedule daily absence check
SignalWire (or Twilio)   → Make voice calls
TwiML                    → Define call script (no extra AI cost)
Google Cloud TTS         → Generate personalized audio with student name
node-fetch / axios       → Call Twilio/SignalWire REST API
mongoose                 → Save call logs
```

**npm packages needed:**
```bash
npm install node-cron twilio @google-cloud/text-to-speech
# OR for SignalWire (same API, cheaper pricing):
npm install node-cron @signalwire/realtime-api @google-cloud/text-to-speech
```

---

## 4. Database Changes

### 4a. Add `parentPhone` to User model

The current `user.model.js` has a `phone` field for the **student** themselves. You need the **parent's phone number**. Add one field to the student user schema:

```js
// In app/user/user.model.js — add inside userSchema fields
parentPhone: {
  type: String,
  trim: true,
  validate(value) {
    if (value && String(value).trim().length > 0) {
      if (!validator.isMobilePhone(String(value), 'any')) {
        throw new Error('Invalid parent mobile number');
      }
    }
  },
},
```

> **Alternative:** If parents have their own User accounts with `role: "parent"`, add a `parentId: { type: ObjectId, ref: 'User' }` field to the student instead.

### 4b. New Model: `AbsenceCallLog`

Create `app/absence-calls/absence-call.model.js`:

```js
const mongoose = require('mongoose');

const absenceCallLogSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
  date:         { type: Date, required: true },            // Date of absence
  parentPhone:  { type: String, required: true },          // Phone called
  callSid:      { type: String },                          // Twilio Call SID
  status: {
    type: String,
    enum: ['pending', 'calling', 'answered', 'no_answer', 'busy', 'failed', 'completed'],
    default: 'pending',
  },
  parentResponse: {
    type: String,
    enum: ['aware', 'query', 'no_input', null],            // What they pressed
    default: null,
  },
  callDurationSeconds: { type: Number },
  retryCount:   { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  completedAt:  { type: Date },
  ttsText:      { type: String },                          // Message that was spoken
}, { timestamps: true });

module.exports = mongoose.model('AbsenceCallLog', absenceCallLogSchema);
```

---

## 5. New Files to Create

```
app/
  absence-calls/
    absence-call.model.js        ← Mongoose model (above)
    absence-call.service.js      ← Core business logic
    absence-call.controller.js   ← Twilio webhook handler
    absence-call.routes.js       ← Express routes for webhooks
    absence-call.cron.js         ← node-cron scheduler
config/
  twilio.js                      ← Twilio/SignalWire client init
```

---

## 6. Implementation Detail

### 6a. `config/twilio.js`
```js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = client;
```

### 6b. `absence-call.service.js` — Core Logic

```js
const Attendance = require('../attendance/attendance.model');
const User = require('../user/user.model');
const AbsenceCallLog = require('./absence-call.model');
const twilioClient = require('../../config/twilio');

/**
 * Step 1: Find all absent students for today and build a call queue
 */
async function buildCallQueue(schoolId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all absent attendance records for today
  const absentRecords = await Attendance.find({
    schoolId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'absent',
  }).populate('studentId', 'fullname parentPhone phone');

  const callQueue = [];

  for (const record of absentRecords) {
    const student = record.studentId;
    const phoneToCall = student.parentPhone || student.phone;

    if (!phoneToCall) continue; // Skip if no phone available

    // Avoid duplicate calls for the same student today
    const alreadyQueued = await AbsenceCallLog.findOne({
      studentId: student._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (alreadyQueued) continue;

    // Create a pending call log
    const log = await AbsenceCallLog.create({
      studentId: student._id,
      schoolId,
      attendanceId: record._id,
      date: startOfDay,
      parentPhone: phoneToCall,
      ttsText: buildTTSMessage(student.fullname, date),
    });

    callQueue.push(log);
  }

  return callQueue;
}

/**
 * Step 2: Generate the spoken message
 */
function buildTTSMessage(studentName, date) {
  const dateStr = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  return (
    `Hello. This is an automated call from your child's school. ` +
    `We want to inform you that ${studentName} was marked absent on ${dateStr}. ` +
    `Press 1 if you are aware of this absence. ` +
    `Press 2 if you would like the school to contact you. ` +
    `Press 3 to repeat this message.`
  );
}

/**
 * Step 3: Initiate calls for all queued logs
 */
async function processCallQueue(callQueue) {
  for (const log of callQueue) {
    try {
      const call = await twilioClient.calls.create({
        to: log.parentPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        // Twilio will GET this URL to get TwiML instructions
        url: `${process.env.APP_BASE_URL}/v1/absence-calls/twiml/${log._id}`,
        statusCallback: `${process.env.APP_BASE_URL}/v1/absence-calls/status/${log._id}`,
        statusCallbackMethod: 'POST',
        machineDetection: 'DetectMessageEnd', // Skip voicemail, hit answering machine
      });

      await AbsenceCallLog.findByIdAndUpdate(log._id, {
        callSid: call.sid,
        status: 'calling',
        lastAttemptAt: new Date(),
      });
    } catch (error) {
      await AbsenceCallLog.findByIdAndUpdate(log._id, { status: 'failed' });
      console.error(`Call failed for log ${log._id}:`, error.message);
    }
  }
}

module.exports = { buildCallQueue, processCallQueue, buildTTSMessage };
```

### 6c. `absence-call.controller.js` — Twilio Webhooks

```js
const AbsenceCallLog = require('./absence-call.model');
const { buildTTSMessage } = require('./absence-call.service');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

/**
 * GET /v1/absence-calls/twiml/:logId
 * Twilio fetches this to get TwiML instructions for the call
 */
async function getTwiML(req, res) {
  const log = await AbsenceCallLog.findById(req.params.logId)
    .populate('studentId', 'fullname');

  const twiml = new VoiceResponse();

  if (!log) {
    twiml.say('Sorry, this call is no longer valid.');
    return res.type('text/xml').send(twiml.toString());
  }

  const gather = twiml.gather({
    numDigits: 1,
    action: `/v1/absence-calls/response/${log._id}`,
    method: 'POST',
    timeout: 10,
  });

  // Use <Say> for TTS (built into Twilio, free with calls)
  gather.say({ voice: 'Polly.Joanna', language: 'en-US' }, log.ttsText);

  // If no input, repeat once then hang up
  twiml.say('We did not receive your input. Goodbye.');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
}

/**
 * POST /v1/absence-calls/response/:logId
 * Twilio posts here when parent presses a key
 */
async function handleParentResponse(req, res) {
  const { Digits } = req.body;
  const twiml = new VoiceResponse();

  const responseMap = {
    '1': 'aware',
    '2': 'query',
  };
  const parentResponse = responseMap[Digits] || 'no_input';

  await AbsenceCallLog.findByIdAndUpdate(req.params.logId, {
    parentResponse,
    status: 'completed',
    completedAt: new Date(),
  });

  if (Digits === '1') {
    twiml.say('Thank you. We have noted that you are aware. Goodbye.');
  } else if (Digits === '2') {
    twiml.say('Thank you. A school representative will contact you shortly. Goodbye.');
  } else if (Digits === '3') {
    // Redirect back to TwiML to repeat
    twiml.redirect(`/v1/absence-calls/twiml/${req.params.logId}`);
  } else {
    twiml.say('Invalid input. Goodbye.');
  }

  twiml.hangup();
  res.type('text/xml').send(twiml.toString());
}

/**
 * POST /v1/absence-calls/status/:logId
 * Twilio posts call status updates (completed, no-answer, busy, failed)
 */
async function handleCallStatus(req, res) {
  const { CallStatus, CallDuration } = req.body;

  const statusMap = {
    'completed': 'completed',
    'busy': 'busy',
    'no-answer': 'no_answer',
    'failed': 'failed',
    'canceled': 'failed',
  };

  const update = {
    status: statusMap[CallStatus] || CallStatus,
    callDurationSeconds: parseInt(CallDuration) || 0,
  };

  // If no answer, mark for retry (retry logic in cron)
  if (CallStatus === 'no-answer') {
    update.$inc = { retryCount: 1 };
  }

  await AbsenceCallLog.findByIdAndUpdate(req.params.logId, update);
  res.sendStatus(200);
}

module.exports = { getTwiML, handleParentResponse, handleCallStatus };
```

### 6d. `absence-call.routes.js`

```js
const express = require('express');
const router = express.Router();
const controller = require('./absence-call.controller');

// These routes are called by Twilio (no auth middleware — secured by Twilio signature validation)
router.get('/twiml/:logId', controller.getTwiML);
router.post('/response/:logId', controller.handleParentResponse);
router.post('/status/:logId', controller.handleCallStatus);

module.exports = router;
```

### 6e. `absence-call.cron.js` — Scheduler

```js
const cron = require('node-cron');
const { buildCallQueue, processCallQueue } = require('./absence-call.service');
const School = require('../school/school.model'); // adjust path

/**
 * Runs every weekday at 9:30 AM
 * (adjust time to be after attendance is marked)
 */
function startAbsenceCallCron() {
  cron.schedule('30 9 * * 1-5', async () => {
    console.log('[AbsenceCall] Running absence call cron...');
    try {
      const schools = await School.find({ status: 'active' });

      for (const school of schools) {
        const queue = await buildCallQueue(school._id, new Date());
        console.log(`[AbsenceCall] School ${school._id}: ${queue.length} calls queued`);
        await processCallQueue(queue);
      }
    } catch (err) {
      console.error('[AbsenceCall] Cron error:', err);
    }
  }, {
    timezone: 'Asia/Karachi', // adjust to your timezone
  });

  // Retry unanswered calls at 11:00 AM
  cron.schedule('0 11 * * 1-5', async () => {
    const { AbsenceCallLog } = require('./absence-call.model');
    const pendingRetries = await AbsenceCallLog.find({
      status: 'no_answer',
      retryCount: { $lt: 2 }, // max 2 retries
      date: { $gte: new Date(new Date().setHours(0,0,0,0)) },
    });
    if (pendingRetries.length) {
      await processCallQueue(pendingRetries);
    }
  }, { timezone: 'Asia/Karachi' });
}

module.exports = { startAbsenceCallCron };
```

### 6f. Register in `app.js` / `server.js`

```js
// In server.js or app.js, after DB connects:
const { startAbsenceCallCron } = require('./app/absence-calls/absence-call.cron');
startAbsenceCallCron();

// In app/routes.js — add webhook routes (no auth on these):
const absenceCallRoutes = require('./absence-calls/absence-call.routes');
app.use('/v1/absence-calls', absenceCallRoutes);
```

---

## 7. Environment Variables Needed

Add to your `.env`:

```env
# Twilio (or SignalWire — same variable names)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Your server's public URL (Twilio needs to reach your webhooks)
# Use ngrok for local dev: https://xxxx.ngrok.io
APP_BASE_URL=https://your-backend-domain.com
```

---

## 8. Admin API Endpoints (Optional — for manual triggers & reporting)

Add these protected routes for admin use:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/absence-calls/trigger` | Manually trigger calls for a specific date/school |
| `GET`  | `/v1/absence-calls/logs` | List call logs (filterable by date, school, status) |
| `GET`  | `/v1/absence-calls/logs/:studentId` | Call history for one student |

---

## 9. Implementation Steps (in order)

- [ ] **Step 1** — Add `parentPhone` field to `app/user/user.model.js`
- [ ] **Step 2** — Update admin UI / student registration form to capture parent phone
- [ ] **Step 3** — Install dependencies: `npm install node-cron twilio`
- [ ] **Step 4** — Create `config/twilio.js`
- [ ] **Step 5** — Create `app/absence-calls/absence-call.model.js`
- [ ] **Step 6** — Create `app/absence-calls/absence-call.service.js`
- [ ] **Step 7** — Create `app/absence-calls/absence-call.controller.js`
- [ ] **Step 8** — Create `app/absence-calls/absence-call.routes.js`
- [ ] **Step 9** — Create `app/absence-calls/absence-call.cron.js`
- [ ] **Step 10** — Register routes + start cron in `server.js`
- [ ] **Step 11** — Add env vars + get Twilio/SignalWire account
- [ ] **Step 12** — Test locally with ngrok + Twilio test credentials

---

## 10. Upgrade Path (if you want real AI conversation later)

If you later want parents to speak freely instead of pressing buttons:

| Feature | Add-on | Extra Cost |
|---------|--------|------------|
| Speech-to-text (parent speaks) | Twilio `<Gather input="speech">` + Deepgram | ~$0.007/15s |
| NLP intent recognition | Google Dialogflow CX (free 600 requests/month) | $0.007/req after |
| Full AI voice agent | OpenAI Realtime API | $0.06/min in + $0.24/min out |

Start with DTMF (press-1) — it handles 95% of use cases at near-zero cost.

---

## 11. Security Notes

- Twilio webhooks must be validated using `twilio.validateRequest()` middleware to prevent spoofed requests
- Never expose `TWILIO_AUTH_TOKEN` in logs or client-side code
- Parent phone numbers are PII — ensure DB access controls are in place
- Rate-limit the manual trigger endpoint to prevent abuse

---

## 12. SignalWire vs Twilio (Cheapest Choice)

SignalWire is API-compatible with Twilio (same SDK, same TwiML) but costs ~50-60% less per minute:

```js
// To switch from Twilio to SignalWire, just change config/twilio.js:
const { RestClient } = require('@signalwire/compatibility-api');

const client = new RestClient(
  process.env.SIGNALWIRE_PROJECT_ID,
  process.env.SIGNALWIRE_API_TOKEN,
  { signalwireSpaceUrl: process.env.SIGNALWIRE_SPACE_URL }
);
```

Everything else (TwiML, webhooks, status callbacks) stays identical.
