const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const OpenAI = require("openai");

const ContactMessage = require("./models/ContactMessage");
const AnalyticsEvent = require("./models/AnalyticsEvent");

const app = express();

app.use(cors());
app.use(express.json());

// ================= OPENAI CLIENT =================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
`;
}


// ================= CONNECT TO MONGODB =================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });


// ================= TEST ROUTE =================

app.get("/", (req, res) => {
  res.send("Krishna Sahu Portfolio Backend is running!");
});


// ================= CONTACT FORM API =================

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const newMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message saved successfully!",
    });
  } catch (error) {
    console.log("Error saving message:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save message.",
    });
  }
});


// ================= ANALYTICS API =================

app.post("/api/analytics", async (req, res) => {
  try {
    const { eventType, page, metadata } = req.body;

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
    console.log("Analytics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to record analytics event.",
    });
  }
});


// ================= ANALYTICS SUMMARY API =================

app.get("/api/analytics/summary", async (req, res) => {
  try {

    // ================= TOTAL COUNTS =================

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

    const mostViewedProjects = await AnalyticsEvent.aggregate([
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


    // ================= AI ACTION BREAKDOWN =================

    const aiActionBreakdown = await AnalyticsEvent.aggregate([
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


    // ================= DAILY ANALYTICS =================

    const dailyAnalytics = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
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


    // ================= FORMAT DAILY ANALYTICS =================

    const dailyAnalyticsFormatted = {};

    dailyAnalytics.forEach((item) => {
      const date = item._id.date;
      const eventType = item._id.eventType;

      if (!dailyAnalyticsFormatted[date]) {
        dailyAnalyticsFormatted[date] = {
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

      if (eventType === "page_view") {
        dailyAnalyticsFormatted[date].pageViews = item.count;
      }

      if (eventType === "ai_message") {
        dailyAnalyticsFormatted[date].aiMessages = item.count;
      }

      if (eventType === "project_view") {
        dailyAnalyticsFormatted[date].projectViews = item.count;
      }

      if (eventType === "resume_view") {
        dailyAnalyticsFormatted[date].resumeViews = item.count;
      }

      if (eventType === "resume_download") {
        dailyAnalyticsFormatted[date].resumeDownloads = item.count;
      }

      if (eventType === "certificate_view") {
        dailyAnalyticsFormatted[date].certificateViews =
          item.count;
      }

      if (eventType === "contact_submission") {
        dailyAnalyticsFormatted[date].contactSubmissions =
          item.count;
      }
    });

    const dailyAnalyticsArray = Object.values(
      dailyAnalyticsFormatted
    );


    // ================= ENGAGEMENT INSIGHTS =================

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


    // Resume download rate

    const resumeDownloadRate =
      resumeViews > 0
        ? Number(
            ((resumeDownloads / resumeViews) * 100).toFixed(1)
          )
        : 0;


    // Contact conversion rate

    const contactConversionRate =
      pageViews > 0
        ? Number(
            ((contactSubmissions / pageViews) * 100).toFixed(1)
          )
        : 0;


    // AI engagement rate

    const aiEngagementRate =
      pageViews > 0
        ? Number(
            ((aiMessages / pageViews) * 100).toFixed(1)
          )
        : 0;


    const engagementInsights = {
      mostPopularInteraction: {
        label: mostPopularInteraction.label,
        count: mostPopularInteraction.count,
      },

      mostViewedProject:
        mostViewedProjects.length > 0
          ? mostViewedProjects[0].project
          : "No project views yet",

      resumeDownloadRate,

      contactConversionRate,

      aiEngagementRate,
    };


    // ================= SEND RESPONSE =================

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

        dailyAnalytics: dailyAnalyticsArray,

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
      message: "Failed to load analytics summary.",
    });
  }
});


// ================= AI PORTFOLIO ASSISTANT API =================

app.post("/api/assistant", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "OPENAI_API_KEY is missing in the backend .env file.",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: buildAssistantInput(
        message.trim(),
        history
      ),
    });

    res.json({
      success: true,
      reply: response.output_text,
    });

  } catch (error) {

    console.log(
      "AI Assistant error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to get AI response.",
    });
  }
});


// ================= START SERVER =================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});