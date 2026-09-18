const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");

const ContactMessage = require("./models/ContactMessage");
const AnalyticsEvent = require("./models/AnalyticsEvent");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// OPENAI
// =====================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// =====================================================
// EMAIL CONFIGURATION
// =====================================================

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// =====================================================
// PORTFOLIO KNOWLEDGE
// =====================================================

const portfolioKnowledge = `
You are the AI Portfolio Assistant for Krishna Sahu.

Your job is to answer questions about Krishna's portfolio naturally,
professionally, accurately, and conversationally.

Do not invent information that is not present in this knowledge base.

PERSON:
Name: Krishna Sahu

EDUCATION:
- BSc IT
- Currently pursuing MCA

SKILLS:
- C
- C++
- Python
- Java
- HTML
- CSS
- JavaScript
- PHP
- MySQL
- Node.js
- Express.js
- MongoDB
- Power BI
- Data Analysis
- Machine Learning
- Git & GitHub
- Figma

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
- Portfolio analytics

CONTACT:
The portfolio contains a contact form where visitors can enter:
- Name
- Email
- Subject
- Message

The contact form saves submissions in MongoDB.
`;


// =====================================================
// AI INPUT BUILDER
// =====================================================

function buildAssistantInput(message, history) {
  const conversation = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            (item.role === "user" || item.role === "assistant") &&
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

If the user asks a follow-up question, use the conversation history
to understand what they are referring to.

Keep answers professional and useful.

Do not claim Krishna has skills, projects, experience, certifications,
or qualifications that are not present in the portfolio knowledge.
`;
}


// =====================================================
// EMAIL HTML ESCAPE
// =====================================================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =====================================================
// CONNECT TO MONGODB
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("Krishna Sahu Portfolio Backend is running!");
});


// =====================================================
// CONTACT FORM API
// =====================================================

app.post("/api/contact", async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      portfolioWebsite,
    } = req.body;


    // =================================================
    // HONEYPOT SPAM PROTECTION
    // =================================================

    if (
      typeof portfolioWebsite === "string" &&
      portfolioWebsite.trim() !== ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Unable to submit the message.",
      });
    }


    // =================================================
    // BASIC BACKEND VALIDATION
    // =================================================

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }


    // =================================================
    // SAVE MESSAGE TO MONGODB
    // =================================================

    const newMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
    });

    await newMessage.save();

    console.log(
      `Contact message saved from ${email}`
    );


    // =================================================
    // EMAIL CONFIGURATION CHECK
    // =================================================

    const emailConfigured =
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_TO;


    // =================================================
    // SEND EMAILS
    // =================================================

    if (emailConfigured) {
      try {

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message);


        // =============================================
        // 1. EMAIL TO KRISHNA
        // =============================================

        await mailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          replyTo: email,

          subject: `Portfolio Contact: ${subject}`,

          text: `
New contact form submission from your portfolio.

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
          `,

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 30px;">

              <h2 style="margin-bottom: 20px;">
                New Portfolio Contact
              </h2>

              <p>
                Someone has submitted a new message through your portfolio website.
              </p>

              <div style="margin-top: 25px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">

                <p>
                  <strong>Name:</strong>
                  ${safeName}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${safeEmail}
                </p>

                <p>
                  <strong>Subject:</strong>
                  ${safeSubject}
                </p>

                <p>
                  <strong>Message:</strong>
                </p>

                <p style="white-space: pre-line;">
                  ${safeMessage}
                </p>

              </div>

              <p style="margin-top: 25px; color: #666;">
                You can directly reply to this email to respond to the visitor.
              </p>

            </div>
          `,
        });


        console.log(
          `Notification email sent to ${process.env.EMAIL_TO}`
        );


        // =============================================
        // 2. CONFIRMATION EMAIL TO VISITOR
        // =============================================

        await mailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,

          subject: "Your message has been received — Krishna Sahu",

          text: `
Hi ${name},

Thank you for contacting Krishna Sahu.

Your message has been successfully submitted through the portfolio website.

Subject: ${subject}

Krishna has received your message and can get back to you using the email address you provided.

Best regards,
Krishna Sahu
          `,

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 30px;">

              <div style="padding: 30px; border: 1px solid #e5e7eb; border-radius: 14px;">

                <h2 style="margin-top: 0;">
                  Thank You, ${safeName}!
                </h2>

                <p style="font-size: 16px; line-height: 1.6;">
                  Your message has been successfully submitted through
                  Krishna Sahu's portfolio website.
                </p>

                <div style="margin-top: 25px; padding: 18px; background: #f7f9fc; border-radius: 10px;">

                  <p style="margin: 0 0 10px;">
                    <strong>Subject:</strong>
                    ${safeSubject}
                  </p>

                  <p style="margin: 0;">
                    Your message has been received successfully.
                  </p>

                </div>

                <p style="margin-top: 25px; line-height: 1.6;">
                  Krishna has received your message and can get back to you
                  using the email address you provided.
                </p>

                <p style="margin-top: 30px;">
                  Best regards,<br />
                  <strong>Krishna Sahu</strong>
                </p>

              </div>

            </div>
          `,
        });


        console.log(
          `Confirmation email sent to ${email}`
        );

      } catch (emailError) {

        // ---------------------------------------------
        // EMAIL FAILURE SHOULD NOT DELETE THE MESSAGE
        // ---------------------------------------------

        console.log(
          "Email notification error:",
          emailError.message
        );

      }
    } else {

      console.log(
        "Email notifications are not configured. Message was saved successfully."
      );

    }


    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    res.status(201).json({
      success: true,
      message: "Message submitted successfully!",
    });

  } catch (error) {

    console.log(
      "Error saving contact message:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to submit message.",
    });

  }
});


// =====================================================
// ANALYTICS API
// =====================================================

app.post("/api/analytics", async (req, res) => {
  try {

    const {
      eventType,
      page,
      metadata,
    } = req.body;

    const analyticsEvent = new AnalyticsEvent({
      eventType,
      page,
      metadata,
    });

    await analyticsEvent.save();

    res.status(201).json({
      success: true,
      message: "Analytics event recorded.",
    });

  } catch (error) {

    console.log(
      "Analytics error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to record analytics event.",
    });

  }
});


// =====================================================
// ANALYTICS SUMMARY API
// =====================================================

app.get("/api/analytics/summary", async (req, res) => {
  try {

    // =================================================
    // TOTAL COUNTS
    // =================================================

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


    // =================================================
    // MOST VIEWED PROJECTS
    // =================================================

    const mostViewedProjects =
      await AnalyticsEvent.aggregate([

        {
          $match: {
            eventType: "project_view",

            "metadata.project": {
              $exists: true,
              $ne: "",
            },
          },
        },

        {
          $group: {
            _id: "$metadata.project",

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

            project: "$_id",

            views: 1,
          },
        },

      ]);


    // =================================================
    // AI ACTION BREAKDOWN
    // =================================================

    const aiActionBreakdown =
      await AnalyticsEvent.aggregate([

        {
          $match: {
            eventType: "ai_action_click",

            "metadata.action": {
              $exists: true,
              $ne: "",
            },
          },
        },

        {
          $group: {
            _id: "$metadata.action",

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

            action: "$_id",

            clicks: 1,
          },
        },

      ]);


    // =================================================
    // DAILY ANALYTICS
    // =================================================

    const dailyAnalytics =
      await AnalyticsEvent.aggregate([

        {
          $match: {
            createdAt: {
              $gte: new Date(
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
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },

              eventType: "$eventType",
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


    // =================================================
    // FORMAT DAILY ANALYTICS
    // =================================================

    const dailyAnalyticsMap = {};

    dailyAnalytics.forEach((item) => {

      const date = item._id.date;

      if (!dailyAnalyticsMap[date]) {

        dailyAnalyticsMap[date] = {
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


      switch (item._id.eventType) {

        case "page_view":
          dailyAnalyticsMap[date].pageViews =
            item.count;
          break;

        case "ai_message":
          dailyAnalyticsMap[date].aiMessages =
            item.count;
          break;

        case "project_view":
          dailyAnalyticsMap[date].projectViews =
            item.count;
          break;

        case "resume_view":
          dailyAnalyticsMap[date].resumeViews =
            item.count;
          break;

        case "resume_download":
          dailyAnalyticsMap[date].resumeDownloads =
            item.count;
          break;

        case "certificate_view":
          dailyAnalyticsMap[date].certificateViews =
            item.count;
          break;

        case "contact_submission":
          dailyAnalyticsMap[date].contactSubmissions =
            item.count;
          break;

        default:
          break;
      }

    });


    const dailyAnalyticsArray =
      Object.values(dailyAnalyticsMap);


    // =================================================
    // ENGAGEMENT INSIGHTS
    // =================================================

    const interactionCounts = [

      {
        label: "AI Messages",
        count: aiMessages,
      },

      {
        label: "Project Views",
        count: projectViews,
      },

      {
        label: "Resume Views",
        count: resumeViews,
      },

      {
        label: "Resume Downloads",
        count: resumeDownloads,
      },

      {
        label: "Certificate Views",
        count: certificateViews,
      },

      {
        label: "Contact Submissions",
        count: contactSubmissions,
      },

      {
        label: "AI Action Clicks",
        count: aiActionClicks,
      },

    ];


    const mostPopularInteraction =
      interactionCounts.reduce(

        (highest, current) =>
          current.count > highest.count
            ? current
            : highest,

        {
          label: "No interactions yet",

          count: 0,
        }

      );


    const resumeDownloadRate =
      resumeViews > 0
        ? Number(
            (
              (resumeDownloads /
                resumeViews) *
              100
            ).toFixed(1)
          )
        : 0;


    const contactConversionRate =
      pageViews > 0
        ? Number(
            (
              (contactSubmissions /
                pageViews) *
              100
            ).toFixed(1)
          )
        : 0;


    const aiEngagementRate =
      pageViews > 0
        ? Number(
            (
              (aiMessages /
                pageViews) *
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
          ? mostViewedProjects[0].project
          : "No project views yet",

      resumeDownloadRate,

      contactConversionRate,

      aiEngagementRate,

    };


    // =================================================
    // SEND ANALYTICS RESPONSE
    // =================================================

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
});


// =====================================================
// AI PORTFOLIO ASSISTANT API
// =====================================================

app.post("/api/assistant", async (req, res) => {

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


    if (!process.env.OPENAI_API_KEY) {

      return res.status(500).json({

        success: false,

        message:
          "OPENAI_API_KEY is missing in the backend .env file.",

      });

    }


    const response =
      await openai.responses.create({

        model: "gpt-5.6-luna",

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

});


// =====================================================
// START SERVER
// =====================================================

const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});