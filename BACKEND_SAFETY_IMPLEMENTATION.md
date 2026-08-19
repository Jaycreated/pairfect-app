# Backend User-Generated Content (UGC) Moderation & Reporting Guide

To fully satisfy Apple App Store Guideline 1.2 (User-Generated Content), the remote backend must implement the reporting endpoint (`POST /api/reports`), set up a database schema to log safety incidents, integrate an automated content moderation SDK (such as Google Perspective API or OpenAI Moderation API), and implement real-time notifications to alert the development team to ensure response and resolution within 24 hours.

---

## 🎯 1. API Endpoint Specification

### `POST /api/reports`
Allows users to report messages or profiles that violate safety terms.

* **Headers**: 
  * `Authorization: Bearer {auth_token}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "reportedUserId": "user_id_123",
    "contentType": "message", // "message" | "profile"
    "contentId": "message_id_999", // optional message identifier
    "content": "Offensive message text...", // optional reported text
    "reason": "Harassment or offensive content..." // optional description
  }
  ```
* **Response Body (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Report received. Safety moderators will review this content within 24 hours."
  }
  ```

---

## 💾 2. Database Schema (MySQL/PostgreSQL)

Add a `reports` table to record all safety incidents.

```sql
CREATE TABLE reports (
  id VARCHAR(255) PRIMARY KEY,
  reporter_user_id VARCHAR(255) NOT NULL,
  reported_user_id VARCHAR(255) NOT NULL,
  content_type ENUM('message', 'profile') NOT NULL,
  content_id VARCHAR(255),
  content TEXT,
  reason VARCHAR(500),
  status ENUM('pending', 'reviewed', 'actioned', 'dismissed') DEFAULT 'pending',
  moderation_score DECIMAL(5,4), -- Automatic machine score
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id)
);

-- Index for speedy queries by support teams
CREATE INDEX idx_reports_status ON reports(status);
```

---

## 🛠️ 3. Node.js & Express Controller Reference

Below is a reference implementation showing Express routing, validation, Perspective/OpenAI integration, database storage, and email notification setup.

### Express Controller Example (`controllers/report.controller.js`)

```javascript
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../models'); // Sequelize or Database models
const { moderateContentWithOpenAI } = require('../services/moderation');

// Email transporter configuration (e.g. SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.createReport = async (req, res) => {
  const reporterId = req.user.id; // From auth middleware
  const { reportedUserId, contentType, contentId, content, reason } = req.body;

  if (!reportedUserId || !contentType) {
    return res.status(400).json({ success: false, message: 'Missing required parameters.' });
  }

  try {
    // 1. Moderate content automatically using Perspective/OpenAI SDK
    let autoScore = 0;
    let autoFlaged = false;
    
    if (content && content.trim().length > 0) {
      const moderationResult = await moderateContentWithOpenAI(content);
      autoScore = moderationResult.score;
      autoFlaged = moderationResult.flagged;
    }

    // 2. Save report to database
    const reportId = crypto.randomUUID();
    await db.Report.create({
      id: reportId,
      reporter_user_id: reporterId,
      reported_user_id: reportedUserId,
      content_type: contentType,
      content_id: contentId,
      content: content,
      reason: reason,
      moderation_score: autoScore,
      status: autoFlaged ? 'actioned' : 'pending'
    });

    // 3. Auto-Moderate: If machine validation flagged severe violation, auto-suspend target
    if (autoFlaged) {
      await db.User.update(
        { is_suspended: true, has_chat_access: false },
        { where: { id: reportedUserId } }
      );
      
      // If it was a message, hide/delete it
      if (contentType === 'message' && contentId) {
        await db.Message.destroy({ where: { id: contentId } });
      }
    }

    // 4. Send Instant Developer Notification (supports 24h SLA response)
    const alertSubject = `🚨 UGC Safety Alert [${contentType.toUpperCase()}] - Action Required within 24h`;
    const alertHtml = `
      <h2>Safety Report Received</h2>
      <p><strong>Report ID:</strong> ${reportId}</p>
      <p><strong>Reporter ID:</strong> ${reporterId}</p>
      <p><strong>Offending User ID:</strong> ${reportedUserId}</p>
      <p><strong>Content Type:</strong> ${contentType}</p>
      <p><strong>Reported Text:</strong> "${content || 'N/A'}"</p>
      <p><strong>Reporter Reason:</strong> ${reason || 'Not specified'}</p>
      <p><strong>AI Moderation Score:</strong> ${autoScore} (Flagged: ${autoFlaged ? 'YES - Auto Suspended' : 'NO'})</p>
      <br/>
      <p><em>Note: Under Apple Guideline 1.2, you must act on this report within 24 hours by either removing the content, banning the user, or dismissing the report.</em></p>
    `;

    // Notify development/moderation channel
    await transporter.sendMail({
      from: '"Pairfect Safety" <safety@pairfect.com.ng>',
      to: process.env.MODERATOR_EMAIL || 'support@pairfect.com.ng',
      subject: alertSubject,
      html: alertHtml,
    }).catch(err => console.error('SMTP notification failed:', err));

    return res.status(201).json({
      success: true,
      message: autoFlaged 
        ? 'Report received and processed. Content has been auto-flagged and removed.' 
        : 'Report received. Our moderation team will review this within 24 hours.'
    });

  } catch (error) {
    console.error('Safety report controller failed:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
```

---

## 🤖 4. Content Moderation SDK Integrations

### Option A: OpenAI Moderation API (Recommended)
Extremely simple to execute, requires no custom model setups.

```javascript
const axios = require('axios');

async function moderateContentWithOpenAI(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/moderations',
      { input: text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.results[0];
    // Find the highest score category
    const categoryScores = result.category_scores;
    const maxScore = Math.max(...Object.values(categoryScores));

    return {
      flagged: result.flagged,
      score: maxScore
    };
  } catch (error) {
    console.error('OpenAI Moderation API failed:', error);
    return { flagged: false, score: 0 };
  }
}
```

### Option B: Google Perspective API
Designed specifically to filter harassment, hate speech, and toxicity in UGC.

```javascript
const axios = require('axios');

async function moderateContentWithPerspective(text) {
  try {
    const apiKey = process.env.PERSPECTIVE_API_KEY;
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`;
    
    const response = await axios.post(url, {
      comment: { text: text },
      languages: ["en"],
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        INSULT: {},
        PROFANITY: {},
        SEXUALLY_EXPLICIT: {}
      }
    });

    const scores = response.data.attributeScores;
    const toxicityScore = scores.TOXICITY.summaryValue.value;
    const severeToxicity = scores.SEVERE_TOXICITY.summaryValue.value;
    
    // Flag if severity or toxicity exceeds 80%
    const flagged = toxicityScore > 0.8 || severeToxicity > 0.7;

    return {
      flagged,
      score: toxicityScore
    };
  } catch (error) {
    console.error('Perspective API failed:', error);
    return { flagged: false, score: 0 };
  }
}
```

---

## 🕒 5. Meeting the 24-Hour Moderation SLA
To strictly satisfy Apple's requirement that **"the developer must act on objectionable content reports within 24 hours"**:
1. **Webhooks / SMTP Alerts**: Always trigger instant notifications (Slack, Discord, or Email) upon database writes to `reports`.
2. **Auto-Hiding**: If `moderation_score` exceeds threshold (> 0.8), immediately hide the reported content from public feeds and suspend the user's chat authorization.
3. **Simple Admin Moderation Command**: Provide a simple admin script or dashboard endpoint (e.g. `POST /api/admin/reports/:id/resolve`) so reviewers can ban the user (`is_suspended = true`) or dismiss the report with one click.
