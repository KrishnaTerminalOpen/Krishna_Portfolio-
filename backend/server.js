const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");

const ContactMessage = require("./models/ContactMessage");
const AnalyticsEvent = require("./models/AnalyticsEvent");

const app = express();

app.use(cors());
app.use(express.json());


// ================= OPENAI CLIENT =================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ================= EMAIL NOTIFICATION =================

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ================= HTML ESCAPE HELPER =================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ================= PORTFOLIO KNOWLEDGE =================

const portfolioKnowledge = `
You are the AI portfolio assistant for Krishna Sahu.

IMPORTANT RULES:
- Answer questions about Krishna's portfolio using the portfolio information below.
- Be professional, friendly, concise, and natural.
- You are an assistant representing the portfolio; never claim to be Krishna himself.
- If information is not present below, clearly say that the portfolio does not currently provide that information and suggest using the Contact section.
- Do not invent companies, job roles, projects, achievements, contact details, or certificates.
- Use the conversation history to understand follow-up questions.

PORTFOLIO INFORMATION

Name:
Krishna Sahu

Education:
B.Tech CSE

Location:
Bangalore, India

Professional focus:
Aspiring Data Scientist | AI/ML Enthusiast

Interests:
Data Science, AI/ML, Web Development

Goal:
To build intelligent solutions and grow continuously.

About:
Krishna is a Computer Science student with a strong interest in Data Science, Machine Learning and AI. He enjoys exploring data, finding patterns and building solutions that create real impact. He is constantly learning, building projects and looking for opportunities to grow in AI and Data Science.

SKILLS:
- Python — 90%
- Java — 80%
- SQL — 85%
- HTML — 85%
- CSS — 85%
- JavaScript — 75%
- Figma — 80%
- MySQL — 80%
- NumPy — 80%
- Machine Learning — 85%
- Power BI — 80%
- Git & GitHub — 85%

PROJECTS:

1. Expense Tracker
Category: Data Science
Description: A project for tracking and analyzing personal expenses.
Technologies: Python, Data Analysis
Details: An expense tracking project designed to record, organize and analyze personal expenses.

2. Student Performance Prediction
Category: Machine Learning
Description: A machine learning project to predict student performance.
Technologies: Python, Pandas, NumPy, Scikit-learn
Details: A machine learning project that analyzes academic information and predicts student performance.

3. Movie Recommendation System
Category: Machine Learning
Description: A recommendation system that suggests movies to users.
Technologies: Python, Machine Learning

CERTIFICATIONS:
- Data Analytics — Google — Data Science
- Machine Learning — Coursera — AI/ML
- Python Programming — Udemy — Data Science
- AI for Everyone — Coursera — AI/ML
- Power BI — Microsoft — Data Science
- Web Development — Internshala — Web Development

RESUME:
The portfolio provides a Resume section with View Resume and Download Resume actions.

PORTFOLIO FEATURES:
- Skills category filtering
- Project category filtering
- Project search
- Project details modal
- Certificate category filtering
- Dark/light mode with saved theme preference
- Contact form connected to the backend
- AI Portfolio Assistant
`;


// ================= AI INPUT BUILDER =================

function buildAssistantInput(message, history) {
  const conversation = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            (item.role === "user" ||
              item.role === "assistant") &&
            typeof item.content === "string"
        )
        .slice(-12)
        .map(
          (item) =>
            `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`
        )
        .join("\n")
    : "";

  return `
${portfolioKnowledge}

CONVERSATION HISTORY:
${conversation || "No previous conversation."}

CURRENT USER QUESTION:
${message}

Answer the current user question naturally.
`;
}


// ================= CONNECT TO MONGODB =================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.log(
      "MongoDB connection failed:",
      error.message
    );
  });


// ================= TEST ROUTE =================

app.get("/", (req, res) => {
  res.send(
    "Krishna Sahu Portfolio Backend is running!"
  );
});


// ================= CONTACT FORM API =================

app.post("/api/contact", async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      portfolioWebsite,
    } = req.body;


    // ================= HONEYPOT SPAM PROTECTION =================

    if (
      typeof portfolioWebsite === "string" &&
      portfolioWebsite.trim() !== ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Unable to submit the message.",
      });
    }


    // ================= BACKEND VALIDATION =================

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill in all required fields.",
      });
    }


    // ================= SAVE TO MONGODB =================

    const newMessage =
      new ContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

    await newMessage.save();

    console.log(
      "Contact message saved successfully."
    );


    // ================= FAST RESPONSE =================

    res.status(201).json({
      success: true,
      message:
        "Message submitted successfully.",
    });


    // ================= SEND EMAILS IN BACKGROUND =================

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_TO
    ) {
      void (async () => {
        try {
          const safeName =
            escapeHtml(name.trim());

          const safeEmail =
            escapeHtml(email.trim());

          const safeSubject =
            escapeHtml(subject.trim());

          const safeMessage =
            escapeHtml(
              message.trim()
            ).replace(
              /\n/g,
              "<br>"
            );

          const submittedOn =
            new Date().toLocaleString(
              "en-IN",
              {
                timeZone:
                  "Asia/Kolkata",

                day: "2-digit",

                month: "long",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit",
              }
            );


          // =====================================================
          // EMAIL 1 — KRISHNA NOTIFICATION
          // =====================================================

          await mailTransporter.sendMail({

            from:
              `"Portfolio Website" <${process.env.EMAIL_USER}>`,

            to:
              process.env.EMAIL_TO,

            replyTo:
              email.trim(),

            subject:
              `Portfolio Contact: ${subject.trim()}`,

            text: `
New Portfolio Contact

Someone has submitted a new message through your portfolio website.

Name: ${name.trim()}
Email: ${email.trim()}
Subject: ${subject.trim()}

Message:
${message.trim()}

You can directly reply to this email to respond to the visitor.

Best regards,
Krishna Sahu
Portfolio Website
`,

            html: `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>
New Portfolio Contact
</title>

</head>


<body
style="
margin:0;
padding:0;
background:#eef3f9;
font-family:Arial,Helvetica,sans-serif;
color:#14213d;
"
>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#eef3f9;
padding:24px 12px;
"
>

<tr>

<td align="center">


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
max-width:650px;
background:#ffffff;
border-radius:20px;
overflow:hidden;
box-shadow:0 12px 35px rgba(12,35,68,0.12);
"
>


<!-- HEADER -->

<tr>

<td
align="center"
style="
background:#071a35;
padding:30px 28px 32px;
"
>


<div
style="
font-size:20px;
line-height:1.4;
font-weight:700;
letter-spacing:5px;
color:#ffffff;
"
>
KRISHNA SAHU
</div>


<div
style="
font-size:11px;
line-height:1.5;
letter-spacing:4px;
color:#a9bad4;
margin-top:5px;
"
>
PORTFOLIO WEBSITE
</div>


<div
style="
width:84px;
height:4px;
background:#18d4ee;
border-radius:10px;
margin:18px auto 22px;
"
>
</div>


<h1
style="
margin:0;
color:#ffffff;
font-size:30px;
line-height:1.25;
font-weight:700;
"
>
New Portfolio Contact
</h1>


<p
style="
margin:10px auto 0;
max-width:480px;
color:#c6d2e4;
font-size:15px;
line-height:1.6;
"
>
Someone has submitted a new message through your portfolio website.
</p>


</td>

</tr>


<!-- CONTENT -->

<tr>

<td
style="
padding:28px 26px 32px;
background:#ffffff;
"
>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#f8fbff;
border:1px solid #e4ebf4;
border-radius:16px;
"
>


<!-- NAME -->

<tr>

<td
style="
padding:18px 20px 10px;
font-size:14px;
color:#17233c;
"
>

<strong>
👤 &nbsp; Name
</strong>

<br>

<span
style="
display:block;
margin-top:7px;
font-size:15px;
color:#34445c;
"
>
${safeName}
</span>

</td>

</tr>


<!-- EMAIL -->

<tr>

<td
style="
padding:10px 20px;
border-top:1px solid #e5ebf3;
font-size:14px;
color:#17233c;
"
>

<strong>
✉️ &nbsp; Email
</strong>

<br>

<a
href="mailto:${safeEmail}"
style="
display:block;
margin-top:7px;
font-size:15px;
color:#1769e0;
text-decoration:underline;
"
>
${safeEmail}
</a>

</td>

</tr>


<!-- SUBJECT -->

<tr>

<td
style="
padding:10px 20px;
border-top:1px solid #e5ebf3;
font-size:14px;
color:#17233c;
"
>

<strong>
📄 &nbsp; Subject
</strong>

<br>

<span
style="
display:block;
margin-top:7px;
font-size:15px;
color:#34445c;
"
>
${safeSubject}
</span>

</td>

</tr>


<!-- MESSAGE -->

<tr>

<td
style="
padding:10px 20px 20px;
border-top:1px solid #e5ebf3;
font-size:14px;
color:#17233c;
"
>

<strong>
💬 &nbsp; Message
</strong>


<div
style="
margin-top:10px;
padding:16px;
background:#eef4fb;
border-radius:10px;
color:#34445c;
font-size:15px;
line-height:1.7;
"
>
${safeMessage}
</div>


</td>

</tr>


</table>


<div
style="
margin-top:20px;
padding:15px 18px;
background:#eaf3ff;
border-radius:12px;
color:#1457b8;
font-size:14px;
line-height:1.6;
"
>
✈️ &nbsp; You can directly reply to this email to respond to the visitor.
</div>


<div
style="
height:1px;
background:#dce5ef;
margin:26px 0 20px;
"
>
</div>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
>

<tr>

<td
style="
color:#52637a;
font-size:13px;
line-height:1.7;
"
>

Best regards,

<br>

<strong
style="
color:#172033;
font-size:16px;
"
>
Krishna Sahu
</strong>

<br>

Portfolio Website

</td>


<td
align="right"
valign="bottom"
style="
color:#52637a;
font-size:14px;
font-style:italic;
"
>

Build &nbsp;•&nbsp; Learn &nbsp;•&nbsp; Grow

</td>

</tr>

</table>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td
align="center"
style="
background:#071a35;
padding:24px 20px;
color:#c6d2e4;
"
>


<div
style="
width:76px;
height:4px;
background:#18d4ee;
border-radius:10px;
margin:0 auto 15px;
"
>
</div>


<div
style="
font-size:12px;
line-height:1.7;
"
>

© 2026 Krishna Sahu. All rights reserved.

<br>

Thank you for being part of this journey!

</div>


</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
`,
          });


          console.log(
            "Notification email sent to Krishna."
          );


          // =====================================================
          // EMAIL 2 — VISITOR CONFIRMATION
          // =====================================================

          await mailTransporter.sendMail({

            from:
              `"Portfolio Website" <${process.env.EMAIL_USER}>`,

            to:
              email.trim(),

            subject:
              "Your message has been received — Krishna Sahu",

            text: `
Thank You, ${name.trim()}!

Your message has been successfully submitted through Krishna Sahu's portfolio website.

Subject: ${subject.trim()}
Submitted On: ${submittedOn}

Your message has been received successfully.

Krishna has received your message and can get back to you using the email address you provided.

Best regards,
Krishna Sahu
Portfolio Website

Thank you for visiting my portfolio!
`,

            html: `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>
Message Received
</title>

</head>


<body
style="
margin:0;
padding:0;
background:#eef3f9;
font-family:Arial,Helvetica,sans-serif;
color:#14213d;
"
>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#eef3f9;
padding:24px 12px;
"
>

<tr>

<td align="center">


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
max-width:650px;
background:#ffffff;
border-radius:20px;
overflow:hidden;
box-shadow:0 12px 35px rgba(12,35,68,0.12);
"
>


<!-- HEADER -->

<tr>

<td
align="center"
style="
background:#ffffff;
padding:30px 28px 28px;
"
>


<div
style="
font-size:20px;
line-height:1.4;
font-weight:700;
letter-spacing:5px;
color:#10234a;
"
>
KRISHNA SAHU
</div>


<div
style="
font-size:11px;
line-height:1.5;
letter-spacing:4px;
color:#6a7890;
margin-top:5px;
"
>
PORTFOLIO WEBSITE
</div>


<div
style="
width:84px;
height:4px;
background:#18cfe8;
border-radius:10px;
margin:18px auto 22px;
"
>
</div>


<h1
style="
margin:0;
color:#10234a;
font-size:30px;
line-height:1.3;
font-weight:700;
"
>
Thank You, ${safeName}!
</h1>


<p
style="
margin:11px auto 0;
max-width:500px;
color:#50658b;
font-size:15px;
line-height:1.6;
"
>
Your message has been successfully submitted through Krishna Sahu's portfolio website.
</p>


</td>

</tr>


<!-- CONFIRMATION CARD -->

<tr>

<td
style="
padding:8px 26px 30px;
background:#ffffff;
"
>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#f1f6ff;
border-radius:16px;
"
>


<tr>

<td
style="
padding:24px 22px;
"
>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
>


<tr>

<td
width="68"
valign="top"
>


<div
style="
width:54px;
height:54px;
line-height:54px;
text-align:center;
background:#c9f4e4;
border-radius:50%;
font-size:30px;
color:#13a978;
"
>
✓
</div>


</td>


<td valign="top">


<strong
style="
display:block;
color:#10234a;
font-size:17px;
line-height:1.4;
"
>
We've received your message
</strong>


<span
style="
display:block;
margin-top:6px;
color:#50658b;
font-size:14px;
line-height:1.65;
"
>
Thank you for reaching out! Your message has been received successfully. Krishna will get back to you soon using the email address you provided.
</span>


</td>

</tr>

</table>


<div
style="
height:1px;
background:#d6e1ef;
margin:20px 0;
"
>
</div>


<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
>


<!-- SUBJECT -->

<tr>

<td
width="68"
valign="top"
>


<div
style="
width:42px;
height:42px;
line-height:42px;
text-align:center;
background:#dceaff;
border-radius:50%;
font-size:20px;
color:#1769e0;
"
>
▤
</div>


</td>


<td
valign="top"
style="
padding-bottom:15px;
"
>


<strong
style="
display:block;
color:#10234a;
font-size:13px;
"
>
Subject
</strong>


<span
style="
display:block;
margin-top:4px;
color:#34445c;
font-size:14px;
"
>
${safeSubject}
</span>


</td>

</tr>


<!-- SUBMITTED ON -->

<tr>

<td
width="68"
valign="top"
>


<div
style="
width:42px;
height:42px;
line-height:42px;
text-align:center;
background:#eadfff;
border-radius:50%;
font-size:19px;
color:#7447d8;
"
>
◷
</div>


</td>


<td valign="top">


<strong
style="
display:block;
color:#10234a;
font-size:13px;
"
>
Submitted On
</strong>


<span
style="
display:block;
margin-top:4px;
color:#34445c;
font-size:14px;
"
>
${submittedOn}
</span>


</td>

</tr>


</table>


</td>

</tr>

</table>


<!-- QUOTE -->

<div
style="
margin-top:18px;
padding:20px;
background:#e9faf5;
border-radius:14px;
text-align:center;
color:#2d5260;
font-size:14px;
line-height:1.7;
font-style:italic;
"
>


<span
style="
font-size:24px;
color:#10a37f;
font-weight:700;
"
>
“
</span>


Thank you for taking the time to contact me.

<br>

I appreciate your interest!


<span
style="
font-size:24px;
color:#10a37f;
font-weight:700;
"
>
”
</span>


<br>


<strong
style="
display:inline-block;
margin-top:6px;
color:#173b71;
font-style:normal;
"
>
— Krishna Sahu
</strong>


<div
style="
width:54px;
height:3px;
background:#18cfe8;
border-radius:10px;
margin:8px auto 0;
"
>
</div>


</div>


<!-- BRAND VALUES -->

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
margin-top:22px;
"
>


<tr>


<td
align="center"
width="33%"
style="
color:#173b71;
font-size:13px;
line-height:1.5;
"
>


<div
style="
font-size:25px;
margin-bottom:5px;
"
>
▱
</div>


Build Ideas


</td>


<td
align="center"
width="34%"
style="
color:#173b71;
font-size:13px;
line-height:1.5;
"
>


<div
style="
font-size:25px;
margin-bottom:5px;
"
>
↗
</div>


Learn Continuously


</td>


<td
align="center"
width="33%"
style="
color:#173b71;
font-size:13px;
line-height:1.5;
"
>


<div
style="
font-size:25px;
margin-bottom:5px;
"
>
✦
</div>


Grow Together


</td>


</tr>


</table>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td
align="center"
style="
background:#071a35;
padding:24px 20px;
color:#c6d2e4;
"
>


<div
style="
width:76px;
height:4px;
background:#18d4ee;
border-radius:10px;
margin:0 auto 15px;
"
>
</div>


<div
style="
font-size:12px;
line-height:1.7;
"
>

© 2026 Krishna Sahu. All rights reserved.

<br>

Thank you for visiting my portfolio!

</div>


</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
`,
          });


          console.log(
            "Confirmation email sent to visitor."
          );


        } catch (emailError) {

          console.log(
            "Email sending error:",
            emailError.message
          );

        }

      })();

    } else {

      console.log(
        "Email sending skipped because email configuration is missing."
      );

    }


  } catch (error) {

    console.log(
      "Error saving contact message:",
      error.message
    );


    if (!res.headersSent) {

      res.status(500).json({
        success: false,
        message:
          "Unable to submit the message.",
      });

    }

  }

});


// =========================================================
// ANALYTICS API
// =========================================================

app.post(
  "/api/analytics",
  async (req, res) => {

    try {

      const {
        eventType,
        page,
        metadata,
      } = req.body;


      const analyticsEvent =
        new AnalyticsEvent({

          eventType,

          page,

          metadata,

        });


      await analyticsEvent.save();


      res.status(201).json({

        success: true,

        message:
          "Analytics event recorded.",

      });


    } catch (error) {

      console.log(
        "Analytics error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to record analytics event.",

      });

    }

  }
);


// =========================================================
// ANALYTICS SUMMARY API
// =========================================================

app.get(
  "/api/analytics/summary",
  async (req, res) => {

    try {

      const [
        pageViews,
        aiMessages,
        projectViews,
        resumeViews,
        resumeDownloads,
        certificateViews,
        contactSubmissions,
        aiActionClicks,
      ] = await Promise.all([

        AnalyticsEvent.countDocuments({
          eventType: "page_view",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "ai_message",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "project_view",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "resume_view",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "resume_download",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "certificate_view",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "contact_submission",
        }),

        AnalyticsEvent.countDocuments({
          eventType: "ai_action_click",
        }),

      ]);


      // ================= MOST VIEWED PROJECTS =================

      const mostViewedProjects =
        await AnalyticsEvent.aggregate([

          {

            $match: {

              eventType:
                "project_view",

              "metadata.project": {

                $exists: true,

                $ne: "",

              },

            },

          },


          {

            $group: {

              _id:
                "$metadata.project",

              views: {

                $sum: 1,

              },

            },

          },


          {

            $sort: {

              views: -1,

            },

          },


          {

            $limit: 5,

          },


          {

            $project: {

              _id: 0,

              project:
                "$_id",

              views: 1,

            },

          },

        ]);


      // ================= AI ACTION BREAKDOWN =================

      const aiActionBreakdown =
        await AnalyticsEvent.aggregate([

          {

            $match: {

              eventType:
                "ai_action_click",

              "metadata.action": {

                $exists: true,

                $ne: "",

              },

            },

          },


          {

            $group: {

              _id:
                "$metadata.action",

              clicks: {

                $sum: 1,

              },

            },

          },


          {

            $sort: {

              clicks: -1,

            },

          },


          {

            $project: {

              _id: 0,

              action:
                "$_id",

              clicks: 1,

            },

          },

        ]);


      // ================= DAILY ANALYTICS =================

      const dailyAnalytics =
        await AnalyticsEvent.aggregate([

          {

            $match: {

              createdAt: {

                $gte:
                  new Date(
                    Date.now() -
                      7 *
                        24 *
                        60 *
                        60 *
                        1000
                  ),

              },

            },

          },


          {

            $group: {

              _id: {

                date: {

                  $dateToString: {

                    format:
                      "%Y-%m-%d",

                    date:
                      "$createdAt",

                  },

                },

                eventType:
                  "$eventType",

              },

              count: {

                $sum: 1,

              },

            },

          },


          {

            $sort: {

              "_id.date": 1,

            },

          },

        ]);


      // ================= FORMAT DAILY ANALYTICS =================

      const dailyAnalyticsFormatted = {};


      dailyAnalytics.forEach(
        (item) => {

          const date =
            item._id.date;

          const eventType =
            item._id.eventType;


          if (
            !dailyAnalyticsFormatted[
              date
            ]
          ) {

            dailyAnalyticsFormatted[
              date
            ] = {

              date,

              pageViews: 0,

              aiMessages: 0,

              projectViews: 0,

              resumeViews: 0,

              resumeDownloads: 0,

              certificateViews: 0,

              contactSubmissions: 0,

            };

          }


          if (
            eventType ===
            "page_view"
          ) {

            dailyAnalyticsFormatted[
              date
            ].pageViews =
              item.count;

          }


          if (
            eventType ===
            "ai_message"
          ) {

            dailyAnalyticsFormatted[
              date
            ].aiMessages =
              item.count;

          }


          if (
            eventType ===
            "project_view"
          ) {

            dailyAnalyticsFormatted[
              date
            ].projectViews =
              item.count;

          }


          if (
            eventType ===
            "resume_view"
          ) {

            dailyAnalyticsFormatted[
              date
            ].resumeViews =
              item.count;

          }


          if (
            eventType ===
            "resume_download"
          ) {

            dailyAnalyticsFormatted[
              date
            ].resumeDownloads =
              item.count;

          }


          if (
            eventType ===
            "certificate_view"
          ) {

            dailyAnalyticsFormatted[
              date
            ].certificateViews =
              item.count;

          }


          if (
            eventType ===
            "contact_submission"
          ) {

            dailyAnalyticsFormatted[
              date
            ].contactSubmissions =
              item.count;

          }

        }
      );


      const dailyAnalyticsArray =
        Object.values(
          dailyAnalyticsFormatted
        );


      // ================= ENGAGEMENT INSIGHTS =================

      const interactionCounts = [

        {

          label:
            "AI Messages",

          count:
            aiMessages,

        },

        {

          label:
            "Project Views",

          count:
            projectViews,

        },

        {

          label:
            "Resume Views",

          count:
            resumeViews,

        },

        {

          label:
            "Resume Downloads",

          count:
            resumeDownloads,

        },

        {

          label:
            "Certificate Views",

          count:
            certificateViews,

        },

        {

          label:
            "Contact Submissions",

          count:
            contactSubmissions,

        },

        {

          label:
            "AI Action Clicks",

          count:
            aiActionClicks,

        },

      ];


      const mostPopularInteraction =
        interactionCounts.reduce(

          (
            highest,
            current
          ) =>

            current.count >
            highest.count

              ? current

              : highest,

          {

            label:
              "No interactions yet",

            count: 0,

          }

        );


      // ================= RESUME DOWNLOAD RATE =================

      const resumeDownloadRate =
        resumeViews > 0

          ? Number(

              (
                (
                  resumeDownloads /
                  resumeViews
                ) *
                100
              ).toFixed(1)

            )

          : 0;


      // ================= CONTACT CONVERSION RATE =================

      const contactConversionRate =
        pageViews > 0

          ? Number(

              (
                (
                  contactSubmissions /
                  pageViews
                ) *
                100
              ).toFixed(1)

            )

          : 0;


      // ================= AI ENGAGEMENT RATE =================

      const aiEngagementRate =
        pageViews > 0

          ? Number(

              (
                (
                  aiMessages /
                  pageViews
                ) *
                100
              ).toFixed(1)

            )

          : 0;


      const engagementInsights = {

        mostPopularInteraction: {

          label:
            mostPopularInteraction.label,

          count:
            mostPopularInteraction.count,

        },


        mostViewedProject:

          mostViewedProjects.length > 0

            ? mostViewedProjects[0]
                .project

            : "No project views yet",


        resumeDownloadRate,

        contactConversionRate,

        aiEngagementRate,

      };


      // ================= SEND ANALYTICS RESPONSE =================

      res.json({

        success: true,

        analytics: {

          pageViews,

          aiMessages,

          projectViews,

          resumeViews,

          resumeDownloads,

          certificateViews,

          contactSubmissions,

          aiActionClicks,

          mostViewedProjects,

          aiActionBreakdown,

          dailyAnalytics:
            dailyAnalyticsArray,

          engagementInsights,

        },

      });


    } catch (error) {

      console.log(
        "Analytics summary error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to load analytics summary.",

      });

    }

  }
);


// =========================================================
// AI PORTFOLIO ASSISTANT API
// =========================================================

app.post(
  "/api/assistant",
  async (req, res) => {

    try {

      const {
        message,
        history,
      } = req.body;


      if (
        !message ||
        typeof message !== "string" ||
        !message.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a question.",

        });

      }


      if (
        !process.env.OPENAI_API_KEY
      ) {

        return res.status(500).json({

          success: false,

          message:
            "OPENAI_API_KEY is missing in the backend .env file.",

        });

      }


      const response =
        await openai.responses.create({

          model:
            "gpt-5.6-luna",

          input:
            buildAssistantInput(
              message.trim(),
              history
            ),

        });


      res.json({

        success: true,

        reply:
          response.output_text,

      });


    } catch (error) {

      console.log(
        "AI Assistant error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to get AI response.",

      });

    }

  }
);


// =========================================================
// START SERVER
// =========================================================

const PORT = 5000;

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);