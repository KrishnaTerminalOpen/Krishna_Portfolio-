import { useEffect, useState } from "react";
import { motion } from "motion/react";
import "./App.css";

function App() {

  // ================= SKILLS FILTER STATE =================
  const [skillFilter, setSkillFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("All");
  const [shareResumeOpen, setShareResumeOpen] = useState(false);
  const [showMoreShareOptions, setShowMoreShareOptions] = useState(false);
  const [resumePdfShareMessage, setResumePdfShareMessage] = useState("");
  const [resumePdfLinkCopied, setResumePdfLinkCopied] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm Krishna's portfolio assistant. Ask me about his skills, projects, experience, certificates, or resume."
    }
  ]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [databaseProjects, setDatabaseProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // ================= HERO TERMINAL TABS =================
  const [activeHeroTab, setActiveHeroTab] = useState("train");

  // ================= STEP 4: PROJECT DETAILS STATE =================
  const [selectedProject, setSelectedProject] = useState(null);

  // ================= STEP 6: CONTACT FORM STATE =================
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    portfolioWebsite: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactFormErrors, setContactFormErrors] = useState({});
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormStatus, setContactFormStatus] = useState({
    type: "",
    message: "",
  });

  // ================= STEP 8: DARK / LIGHT MODE =================
  const [theme, setTheme] = useState(
    () => localStorage.getItem("portfolio-theme") || "dark"
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0;
      setScrollProgress(scroll);
      setShowBackToTop(totalScroll > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const analyticsRecorded = sessionStorage.getItem(
      "portfolio-page-view-recorded"
    );

    if (analyticsRecorded) {
      return;
    }

    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "page_view",
        page: "portfolio",
      }),
    })
      .then((response) => {
        if (response.ok) {
          sessionStorage.setItem(
            "portfolio-page-view-recorded",
            "true"
          );
        }
      })
      .catch((error) => {
        console.error("Analytics error:", error);
      });
  }, []);

  // ================= PROJECTS DATA =================
  const projects = [
    {
      title: "Expense Tracker",
      category: "Data Science",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
      description:
        "A project for tracking and analyzing personal expenses.",
      tags: ["Python", "Data Analysis"],
      details:
        "An expense tracking project designed to record, organize and analyze personal expenses. It helps users understand their spending patterns and manage financial information more effectively.",
      technologies: ["Python", "Data Analysis"]
    },
    {
      title: "Student Performance Prediction",
      category: "Machine Learning",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      description:
        "A machine learning project to predict student performance.",
      tags: ["Python", "Machine Learning"],
      details:
        "A machine learning project that analyzes academic information and predicts student performance. The project demonstrates how data and machine learning can be used to identify useful patterns.",
      technologies: ["Python", "Pandas", "NumPy", "Scikit-learn"]
    },
    {
      title: "Movie Recommendation System",
      category: "Machine Learning",
      image:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
      description:
        "A recommendation system that suggests movies to users.",
      tags: ["Python", "Machine Learning"]
    }
  ];

  // ================= LOAD PROJECTS FROM MONGODB =================
  useEffect(() => {
    const loadDatabaseProjects = async () => {
      try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
          throw new Error("Failed to load projects from database.");
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.projects)) {
          const formattedProjects = data.projects.map((project) => ({
            title: project.title,
            category: project.category,
            image: project.image || "",
            description: project.description || "",
            tags: Array.isArray(project.technologies)
              ? project.technologies.slice(0, 2)
              : [],
            details: project.details || project.description || "",
            technologies: Array.isArray(project.technologies)
              ? project.technologies
              : [],
            github: project.github || "",
            liveDemo: project.liveDemo || "",
            featured: Boolean(project.featured),
            order: Number(project.order) || 0,
          }));

          setDatabaseProjects(formattedProjects);
        }
      } catch (error) {
        console.error("Project loading error:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadDatabaseProjects();
  }, []);

  // Keep the existing projects and automatically add projects
  // created from the Project Manager. If a database project has
  // the same title as an existing project, the database version wins.
  const combinedProjects = [
    ...projects.filter(
      (project) =>
        !databaseProjects.some(
          (databaseProject) => databaseProject.title === project.title
        )
    ),
    ...databaseProjects,
  ];

  // ================= FILTERED PROJECTS =================
  const filteredProjects = combinedProjects.filter((project) => {

    const matchesCategory =
      projectFilter === "All" ||
      (project.category && project.category.toLowerCase() === projectFilter.toLowerCase());

    const searchText = projectSearch.toLowerCase();

    const matchesSearch =
      project.title.toLowerCase().includes(searchText) ||
      project.description.toLowerCase().includes(searchText) ||
      project.tags.some((tag) =>
        tag.toLowerCase().includes(searchText)
      );

    return matchesCategory && matchesSearch;
  });

  const certificates = [
    { icon: "bi-google", title: "Data Analytics", company: "Google", category: "Data Science" },
    { icon: "bi-circle-fill", title: "Machine Learning", company: "Coursera", category: "AI/ML" },
    { icon: "bi-mortarboard", title: "Python Programming", company: "Udemy", category: "Data Science" },
    { icon: "bi-circle-fill", title: "AI for Everyone", company: "Coursera", category: "AI/ML" },
    { icon: "bi-microsoft", title: "Power BI", company: "Microsoft", category: "Data Science" },
    { icon: "bi-code-square", title: "Web Development", company: "Internshala", category: "Web Development" }
  ];

  const filteredCertificates = certificateFilter === "All"
    ? certificates
    : certificates.filter((certificate) => certificate.category === certificateFilter);

  // ================= SKILLS DATA =================
  const skills = [
    { name: "Python", category: "Data Science & AI", icon: "bi-code-slash", level: "Advanced", tag: "Data Analysis & ML" },
    { name: "Machine Learning", category: "Data Science & AI", icon: "bi-robot", level: "Advanced", tag: "Supervised & Deep Learning" },
    { name: "NumPy & Pandas", category: "Data Science & AI", icon: "bi-table", level: "Advanced", tag: "Data Wrangling & Processing" },
    { name: "SQL", category: "Data Analytics", icon: "bi-database", level: "Advanced", tag: "Complex Queries & Analytics" },
    { name: "Power BI", category: "Data Analytics", icon: "bi-bar-chart-fill", level: "Proficient", tag: "DAX & Business Dashboards" },
    { name: "MySQL", category: "Data Analytics", icon: "bi-database-fill", level: "Proficient", tag: "Relational DB Architecture" },
    { name: "Java", category: "Software & Web", icon: "bi-cup-hot-fill", level: "Proficient", tag: "OOP & System Design" },
    { name: "JavaScript", category: "Software & Web", icon: "bi-filetype-js", level: "Proficient", tag: "Interactive Web Applications" },
    { name: "HTML & CSS", category: "Software & Web", icon: "bi-filetype-html", level: "Advanced", tag: "Modern UI & Responsive Design" },
    { name: "Git & GitHub", category: "Tools", icon: "bi-github", level: "Advanced", tag: "Version Control & CI/CD" },
    { name: "Figma", category: "Tools", icon: "bi-bezier2", level: "Proficient", tag: "UI/UX & Interface Prototyping" }
  ];

  const filteredSkills =
    skillFilter === "All"
      ? skills
      : skills.filter((skill) => skill.category === skillFilter);

  // ================= CONTACT HANDLERS =================
  const handleContactChange = (e) => {
    const { name, value } = e.target;

    setContactForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setContactFormErrors((previous) => {
      if (!previous[name]) {
        return previous;
      }

      const updatedErrors = {
        ...previous,
      };

      delete updatedErrors[name];

      return updatedErrors;
    });

    if (formSubmitted) {
      setFormSubmitted(false);
    }

    if (contactFormStatus.message) {
      setContactFormStatus({
        type: "",
        message: "",
      });
    }
  };

  const trackResumeShare = (method) => {
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "resume_share",
        page: "portfolio",
        metadata: {
          method,
          source: "resume_section",
        },
      }),
    }).catch((error) => {
      console.error("Resume share analytics error:", error);
    });
  };

  const resumePdfUrl = "https://krishnasahu-portfolio.vercel.app/resume.pdf";

  const handleCopyResumePdfLink = async () => {
    try {
      await navigator.clipboard.writeText(resumePdfUrl);
      setResumePdfLinkCopied(true);
      trackResumeShare("resume_pdf_link_copy");

      setTimeout(() => {
        setResumePdfLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Resume PDF link copy error:", error);
      setResumePdfShareMessage(
        "The link could not be copied automatically. Please select and copy the PDF link manually."
      );
    }
  };


  const handleResumeDownload = () => {
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "resume_download",
        page: "portfolio",
        metadata: {
          source: "resume_section",
        },
      }),
    }).catch((error) => {
      console.error("Resume analytics error:", error);
    });

    window.location.href = "/resume-download.pdf";
  };

  const handleResumePdfShare = async () => {
    setResumePdfShareMessage("");

    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setShowMoreShareOptions(true);
      setResumePdfShareMessage(
        "This browser cannot share files directly. Download the PDF below and attach it manually in WhatsApp, Gmail, LinkedIn, or another app."
      );
      return;
    }

    try {
      const response = await fetch("/resume.pdf", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Resume PDF could not be loaded.");
      }

      const pdfBlob = await response.blob();
      const resumeFile = new File(
        [pdfBlob],
        "Krishna-Sahu-Resume.pdf",
        { type: "application/pdf" }
      );

      const shareData = {
        files: [resumeFile],
      };

      if (
        typeof navigator.canShare !== "function" ||
        !navigator.canShare(shareData)
      ) {
        setShowMoreShareOptions(true);
        setResumePdfShareMessage(
          "Your current browser/device does not support direct PDF file sharing. Download the PDF below, then attach the actual file in the app you want to use."
        );
        return;
      }

      await navigator.share(shareData);

      trackResumeShare("resume_pdf_native_share");
      setShowMoreShareOptions(false);
      setResumePdfShareMessage(
        "Your resume PDF was sent to the selected sharing app."
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Resume PDF share error:", error);
      setShowMoreShareOptions(true);
      setResumePdfShareMessage(
        "The PDF could not be shared directly on this browser/device. Download it below and attach the actual PDF manually."
      );
    }
  };

  const getAssistantAction = (message) => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("contact") ||
      lowerMessage.includes("reach krishna") ||
      lowerMessage.includes("get in touch")
    ) {
      return { label: "Contact Krishna", target: "contact" };
    }

    if (lowerMessage.includes("resume") || lowerMessage.includes("cv")) {
      return { label: "View Resume", target: "resume" };
    }

    if (
      lowerMessage.includes("certificate") ||
      lowerMessage.includes("certification")
    ) {
      return { label: "View Certifications", target: "certifications" };
    }

    if (
      lowerMessage.includes("skill") ||
      lowerMessage.includes("technology") ||
      lowerMessage.includes("technologies")
    ) {
      return { label: "View Skills", target: "skills" };
    }

    if (lowerMessage.includes("project") || lowerMessage.includes("projects")) {
      return { label: "View Projects", target: "projects" };
    }

    return null;
  };

  const handleAssistantAction = (target) => {
    const element = document.getElementById(target);

    if (element) {
      fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: "ai_action_click",
          page: "portfolio",
          metadata: {
            action: target,
          },
        }),
      }).catch((error) => {
        console.error("AI action analytics error:", error);
      });

      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  const sendAiMessage = async (rawMessage) => {
    const message = (rawMessage || "").trim();

    if (!message || assistantLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: message
    };

    const assistantAction = getAssistantAction(message);

    const previousMessages = assistantMessages.filter(
      (item) => item.role === "user" || item.role === "assistant"
    );

    setAssistantMessages((previous) => [...previous, userMessage]);
    setAssistantMessage("");
    setAssistantLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: [...previousMessages, userMessage]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get AI response.");
      }

      setAssistantMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
          action: assistantAction
        }
      ]);

      fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: "ai_message",
          page: "portfolio",
          metadata: {
            source: "ai_assistant",
          },
        }),
      }).catch((error) => {
        console.error("AI analytics error:", error);
      });
    } catch (error) {
      console.error("AI Assistant error:", error);

      setAssistantMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI assistant right now. Please try again."
        }
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAssistantSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }
    await sendAiMessage(assistantMessage);
  };

  const validateContactForm = () => {
    const errors = {};

    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const subject = contactForm.subject.trim();
    const message = contactForm.message.trim();

    if (!name) {
      errors.name = "Please enter your name.";
    } else if (name.length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!email) {
      errors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!subject) {
      errors.subject = "Please enter a subject.";
    } else if (subject.length < 3) {
      errors.subject = "Subject must be at least 3 characters.";
    }

    if (!message) {
      errors.message = "Please enter your message.";
    } else if (message.length < 10) {
      errors.message = "Message must be at least 10 characters.";
    }

    setContactFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (contactFormSubmitting) {
      return;
    }

    const isValid = validateContactForm();

    if (!isValid) {
      setFormSubmitted(false);
      return;
    }

    setContactFormSubmitting(true);
    setFormSubmitted(false);
    setContactFormStatus({
      type: "",
      message: "",
    });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
          portfolioWebsite: contactForm.portfolioWebsite.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit message.");
      }

      setFormSubmitted(true);
      setContactFormErrors({});
      setContactFormStatus({
        type: "success",
        message: "Thank you! Your message has been submitted successfully.",
      });

      fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: "contact_submission",
          page: "portfolio",
          metadata: {
            source: "contact_form",
          },
        }),
      }).catch((error) => {
        console.error("Contact analytics error:", error);
      });

      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        portfolioWebsite: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setFormSubmitted(false);
      setContactFormStatus({
        type: "error",
        message:
          error.message || "Sorry, your message could not be sent. Please try again.",
      });
    } finally {
      setContactFormSubmitting(false);
    }
  };

  return (
    <>
      {/* ================= AMBIENT BACKGROUND GLOW ================= */}
      <div className="ambient-glow-wrapper" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      {/* ================= SCROLL PROGRESS BAR ================= */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* ================= NAVBAR ================= */}
      <nav className="portfolio-navbar navbar navbar-expand-lg">

        <div className="container-fluid px-4 px-lg-5">

          <a className="navbar-brand logo" href="#home">
            KS.
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#portfolioNavbar"
            aria-controls="portfolioNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="portfolioNavbar">

            <ul className="navbar-nav mx-auto">

              <li className="nav-item">
                <a className="nav-link active" href="#home">Home</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#skills">Skills</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#projects">Projects</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#experience">Experience</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#certifications">Certifications</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#contact">Contact</a>
              </li>

            </ul>

            <div className="navbar-actions">
              <a
                href="#contact"
                className="nav-cta-button"
              >
                <span className="nav-cta-dot"></span>
                <span>Let's Connect</span>
                <i className="bi bi-arrow-right"></i>
              </a>

              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                <i className={`bi ${theme === "light" ? "bi-moon-stars" : "bi-sun"}`}></i>
              </button>
            </div>

          </div>

        </div>

      </nav>


      {/* ================= HERO ================= */}
      <motion.section
        id="home"
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >

        <div className="hero-content">

          <div className="hero-left">

            <div className="hero-status-pill">
              <span className="status-dot">
                <span className="status-dot-ping"></span>
              </span>
              <span>Available for Data Science & AI Opportunities</span>
            </div>

            <p className="small-label">HELLO, I'M</p>

            <h1>
              Krishna <span>Sahu</span>
            </h1>

            <h2 className="hero-role-heading">
              Data Scientist &amp; <span className="gradient-text">Machine Learning Engineer</span>
            </h2>

            <div className="hero-focus-tags">
              <span className="hero-focus-tag">
                <i className="bi bi-cpu"></i>
                Machine Learning
              </span>
              <span className="hero-focus-tag">
                <i className="bi bi-robot"></i>
                Predictive Modeling
              </span>
              <span className="hero-focus-tag">
                <i className="bi bi-graph-up-arrow"></i>
                Data Analytics
              </span>
            </div>

            <p className="hero-description">
              MCA Student at MIT Manipal (Manipal University, Karnataka) & B.Sc IT Graduate. 
              I specialize in turning raw data into actionable intelligence, training predictive machine learning models, 
              and crafting production-ready analytics systems for real-world impact.
            </p>

            <div className="hero-buttons">

              <a href="#projects" className="dark-button">
                <span>Explore Projects</span>
                <i className="bi bi-arrow-right"></i>
              </a>

              <button
                type="button"
                className="outline-button"
                onClick={handleResumeDownload}
              >
                <span>Download Resume</span>
                <i className="bi bi-download"></i>
              </button>

              <a href="#contact" className="ghost-button">
                <span>Let's Connect</span>
                <i className="bi bi-chat-dots-fill"></i>
              </a>

            </div>

            <div className="social-icons">

              <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn Profile">
                <i className="bi bi-linkedin"></i>
              </a>

              <a href="https://github.com" target="_blank" rel="noreferrer" title="GitHub Profile">
                <i className="bi bi-github"></i>
              </a>

              <a href="mailto:krishnasahu@email.com" title="Direct Email">
                <i className="bi bi-envelope-fill"></i>
              </a>

            </div>

            <div className="hero-stats">

              <div className="hero-stat-card">
                <strong>10+</strong>
                <span>Projects Built</span>
              </div>

              <div className="hero-stat-card">
                <strong>96.4%</strong>
                <span>Model Accuracy</span>
              </div>

              <div className="hero-stat-card">
                <strong>6+</strong>
                <span>Certifications</span>
              </div>

              <div className="hero-stat-card">
                <strong>MIT Manipal</strong>
                <span>MCA Student</span>
              </div>

            </div>

          </div>


          {/* ================= HERO RIGHT — Interactive ML Console ================= */}
          <div className="hero-right">

            <div className="hero-orbit"></div>

            <div className="hero-chip hero-chip-1">
              <i className="bi bi-cpu-fill"></i> Machine Learning
            </div>

            <div className="hero-chip hero-chip-2">
              <i className="bi bi-bar-chart-line-fill"></i> Power BI & SQL
            </div>

            <div className="hero-chip hero-chip-3">
              <i className="bi bi-mortarboard-fill"></i> MIT Manipal (MCA)
            </div>

            <div className="hero-card">

              <div className="hero-card-header">

                <div className="hero-card-dots">
                  <span className="dot-red"></span>
                  <span className="dot-yellow"></span>
                  <span className="dot-green"></span>
                </div>

                <div className="hero-card-tabs">
                  <button
                    type="button"
                    className={`hero-tab ${activeHeroTab === "train" ? "active" : ""}`}
                    onClick={() => setActiveHeroTab("train")}
                  >
                    <i className="bi bi-file-earmark-code"></i> pipeline.py
                  </button>
                  <button
                    type="button"
                    className={`hero-tab ${activeHeroTab === "metrics" ? "active" : ""}`}
                    onClick={() => setActiveHeroTab("metrics")}
                  >
                    <i className="bi bi-graph-up"></i> metrics.json
                  </button>
                </div>

                <div className="hero-card-badge">
                  <span className="pulse-indicator"></span> Python 3.11
                </div>

              </div>

              {activeHeroTab === "train" ? (
                <div className="hero-terminal-body">
                  <div className="code-line"><span className="code-kw">import</span> <span className="code-lib">pandas</span> <span className="code-kw">as</span> <span className="code-alias">pd</span>, <span className="code-lib">torch</span></div>
                  <div className="code-line"><span className="code-kw">from</span> <span className="code-lib">sklearn.ensemble</span> <span className="code-kw">import</span> <span className="code-cls">RandomForestClassifier</span></div>
                  <div className="code-line code-comment"># Data Science & Predictive Pipeline</div>
                  <div className="code-line"><span className="code-var">model</span> = <span className="code-cls">RandomForestClassifier</span>(n_estimators=<span className="code-num">200</span>, max_depth=<span className="code-num">12</span>)</div>
                  <div className="code-line"><span className="code-var">model</span>.<span className="code-func">fit</span>(X_train, y_train)</div>
                  <div className="code-line code-output">
                    <span className="output-prompt">➜</span> <span className="output-text">Model Trained:</span> <strong className="output-acc">96.4% Accuracy</strong> <span className="output-status">[OPTIMAL]</span>
                  </div>
                </div>
              ) : (
                <div className="hero-terminal-body">
                  <div className="code-line"><span className="code-punc">&#123;</span></div>
                  <div className="code-line">&nbsp;&nbsp;<span className="code-key">"model"</span>: <span className="code-str">"RandomForestClassifier"</span>,</div>
                  <div className="code-line">&nbsp;&nbsp;<span className="code-key">"accuracy"</span>: <span className="code-num">0.964</span>,</div>
                  <div className="code-line">&nbsp;&nbsp;<span className="code-key">"precision"</span>: <span className="code-num">0.958</span>,</div>
                  <div className="code-line">&nbsp;&nbsp;<span className="code-key">"status"</span>: <span className="code-str">"Optimal Convergence"</span></div>
                  <div className="code-line"><span className="code-punc">&#125;</span></div>
                </div>
              )}

              {/* Training Progress Bar */}
              <div className="hero-model-status">
                <div className="status-meta">
                  <span><i className="bi bi-lightning-charge-fill"></i> Epoch 50/50</span>
                  <span className="loss-val">Loss: 0.0381 (converged)</span>
                </div>
                <div className="model-progress-track">
                  <div className="model-progress-fill"></div>
                </div>
              </div>

              {/* Feature Importance / Accuracy Chart */}
              <div className="hero-chart-container">
                <div className="chart-header">
                  <span><i className="bi bi-bar-chart-fill"></i> Feature Importance</span>
                  <span className="chart-sub">Model Weights</span>
                </div>
                <div className="hero-chart">
                  <div className="chart-col" style={{ "--h": "88%" }}><span className="bar-tip">88%</span><div className="bar-fill"></div><small>Py</small></div>
                  <div className="chart-col" style={{ "--h": "94%" }}><span className="bar-tip">94%</span><div className="bar-fill"></div><small>ML</small></div>
                  <div className="chart-col" style={{ "--h": "82%" }}><span className="bar-tip">82%</span><div className="bar-fill"></div><small>SQL</small></div>
                  <div className="chart-col" style={{ "--h": "76%" }}><span className="bar-tip">76%</span><div className="bar-fill"></div><small>BI</small></div>
                  <div className="chart-col" style={{ "--h": "90%" }}><span className="bar-tip">90%</span><div className="bar-fill"></div><small>AI</small></div>
                  <div className="chart-col" style={{ "--h": "85%" }}><span className="bar-tip">85%</span><div className="bar-fill"></div><small>Math</small></div>
                </div>
              </div>

              <div className="hero-kpis">

                <div className="hero-kpi">
                  <div className="kpi-icon-wrap"><i className="bi bi-check2-circle"></i></div>
                  <div>
                    <span>Accuracy</span>
                    <strong>96.4%</strong>
                  </div>
                </div>

                <div className="hero-kpi">
                  <div className="kpi-icon-wrap"><i className="bi bi-cpu"></i></div>
                  <div>
                    <span>Models Built</span>
                    <strong>12+ Active</strong>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </motion.section>


      {/* ================= ABOUT ================= */}
      <motion.section
        id="about"
        className="about-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
      >

        <div className="about-grid">

          <div className="about-content">

            <p className="small-label">ABOUT ME</p>

            <h2>
              Driven by Curiosity.
              <br />
              <span>Powered by Data.</span>
            </h2>

            <p className="about-lead">
              I'm Krishna Sahu, currently pursuing my <strong>Master of Computer Applications (MCA)</strong> at <strong>MIT Manipal (Manipal University, Karnataka)</strong> and a <strong>B.Sc IT passout graduate</strong> with a passion for Data Science, Machine Learning, and Intelligent Systems.
            </p>

            <p>
              I thrive on uncovering meaningful patterns within complex datasets, engineering predictive models, and crafting software solutions that translate analytical findings into measurable real-world impact.
            </p>

            <p>
              Whether it's training statistical learning algorithms, designing intuitive Power BI dashboards, or writing clean SQL queries, I'm dedicated to continuous learning, curiosity, and technical craft.
            </p>

            <div className="about-signature-wrap">
              <div className="signature">Krishna Sahu</div>
              <span className="signature-title">MCA Candidate · Data Science & AI</span>
            </div>

          </div>


          {/* ================= ABOUT — Animated Profile Card ================= */}
          <div className="about-photo">

            <div className="about-orbit"></div>

            <div className="about-chip about-chip-1">
              <i className="bi bi-geo-alt-fill"></i> Manipal, Karnataka
            </div>

            <div className="about-chip about-chip-2">
              <i className="bi bi-mortarboard-fill"></i> MIT Manipal (MCA)
            </div>

            <div className="about-profile-card">

              <div className="about-profile-header">
                <div className="about-profile-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="about-profile-title">
                  krishna_profile.json
                </div>
              </div>

              <div className="about-profile-top">

                <div className="about-avatar">KS</div>

                <div className="about-profile-name">
                  <strong>Krishna Sahu</strong>
                  <span>Data Scientist · AI/ML Engineer</span>
                </div>

              </div>

              <div className="about-profile-info">

                <div>
                  <i className="bi bi-geo-alt-fill"></i>
                  Manipal, Karnataka, India
                </div>

                <div>
                  <i className="bi bi-mortarboard-fill"></i>
                  MIT Manipal, Manipal University Karnataka
                </div>

                <div>
                  <i className="bi bi-cpu-fill"></i>
                  Specialization: AI · ML · Data Science
                </div>

              </div>

              <div className="about-skill">
                <div className="about-skill-header">
                  <span>Python & Data Pipelines</span>
                  <span>90%</span>
                </div>
                <div className="about-skill-bar">
                  <span style={{ width: "90%" }}></span>
                </div>
              </div>

              <div className="about-skill">
                <div className="about-skill-header">
                  <span>Machine Learning & Modeling</span>
                  <span>85%</span>
                </div>
                <div className="about-skill-bar">
                  <span style={{ width: "85%" }}></span>
                </div>
              </div>

              <div className="about-skill">
                <div className="about-skill-header">
                  <span>SQL & Business Analytics</span>
                  <span>85%</span>
                </div>
                <div className="about-skill-bar">
                  <span style={{ width: "85%" }}></span>
                </div>
              </div>

              <div className="about-status">
                <span className="about-status-dot"></span>
                <span>Open for Data Science Roles & Internships</span>
              </div>

            </div>

          </div>


          <div className="about-details">

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-person-fill"></i>
              </div>
              <div>
                <b>Name</b>
                <span>Krishna Sahu</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <div>
                <b>Education</b>
                <span>MCA (MIT Manipal) · B.Sc IT Graduate</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div>
                <b>Location</b>
                <span>Manipal, Karnataka, India</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-grid-fill"></i>
              </div>
              <div>
                <b>Key Interests</b>
                <span>Data Science, AI/ML, Full-Stack Engineering</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-bullseye"></i>
              </div>
              <div>
                <b>Career Goal</b>
                <span>Engineer scalable data systems & intelligent models</span>
              </div>
            </div>

          </div>

        </div>

      </motion.section>


      {/* ================= SKILLS ================= */}
      <section id="skills" className="skills-section">

        <div className="section-container">

          <p className="small-label">MY SKILLS</p>

          <h2 className="section-title">
            Tools & <span>Technologies</span>
          </h2>

          <p className="section-intro">
            A curated stack of tools and frameworks I use across data science, machine learning, and full-stack development.
          </p>

          <div className="skill-filter">

            {[
              "All",
              "Data Science & AI",
              "Data Analytics",
              "Software & Web",
              "Tools"
            ].map((category) => (

              <button
                key={category}
                className={skillFilter === category ? "filter-active" : ""}
                onClick={() => setSkillFilter(category)}
              >
                {category}
              </button>

            ))}

          </div>

          <div className="technology-grid">

            {filteredSkills.map((skill) => (

              <Skill
                key={skill.name}
                name={skill.name}
                icon={skill.icon}
                level={skill.level}
                tag={skill.tag}
              />

            ))}

          </div>

        </div>

      </section>


      {/* ================= PROJECTS ================= */}
      <section id="projects" className="projects-section">

        <div className="section-container">

          <div className="projects-heading">

            <div>

              <p className="small-label">FEATURED PROJECTS</p>

              <h2 className="section-title">
                My <span>Projects</span>
              </h2>

              <p className="section-intro">
                A collection of projects that showcase my skills and
                problem-solving approach.
              </p>

            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <a href="#projects" className="view-all">
                View All Projects
                <i className="bi bi-arrow-right"></i>
              </a>

              <a
                href="/#/admin/projects"
                className="view-all"
                onClick={(event) => {
                  event.preventDefault();
                  window.location.hash = "/admin/projects";
                  window.location.reload();
                }}
              >
                <i className="bi bi-plus-lg" style={{ marginRight: "7px" }}></i>
                Add Project
              </a>
            </div>

          </div>

          <div className="mb-3" style={{ maxWidth: "350px" }}>

            <div className="input-group">

              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />

            </div>

          </div>

          <div className="project-filter">

            {[
              "All",
              "Data Science",
              "Web Development",
              "Machine Learning",
              "Data Analytics"
            ].map((category) => (

              <button
                key={category}
                className={projectFilter === category ? "filter-active" : ""}
                onClick={() => setProjectFilter(category)}
              >
                {category}
              </button>

            ))}

          </div>

          <div className="projects-grid">

            {filteredProjects.length > 0 ? (

              filteredProjects.map((project) => (

                <ProjectCard
                  key={project.title}
                  category={project.category.toUpperCase()}
                  title={project.title}
                  image={project.image}
                  description={project.description}
                  tags={project.tags}
                  details={project.details}
                  technologies={project.technologies}
                  github={project.github}
                  liveDemo={project.liveDemo}
                  onViewDetails={() => setSelectedProject(project)}
                />

              ))

            ) : (

              <div className="no-projects">
                <p>No projects found.</p>
              </div>

            )}

          </div>

        </div>

      </section>


      {/* ================= PROJECT DETAILS MODAL ================= */}
      {selectedProject && (
        <div
          className="project-details-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-details-title"
          onClick={() => setSelectedProject(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="project-details-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 id="project-details-title" style={{ margin: 0 }}>
                {selectedProject.title}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "28px",
                  cursor: "pointer",
                  lineHeight: 1,
                  color: "inherit",
                }}
              >
                ×
              </button>
            </div>

            <img
              src={selectedProject.image}
              alt={selectedProject.title}
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            />

            <p>
              <strong>Category:</strong> {selectedProject.category}
            </p>

            <h4>About This Project</h4>
            <p>{selectedProject.details}</p>

            <h4>Technologies Used</h4>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {selectedProject.technologies.map((technology, index) => (
                <span key={index}>{technology}</span>
              ))}
            </div>

            <div style={{ textAlign: "right", marginTop: "25px" }}>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                style={{
                  padding: "11px 24px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPERIENCE ================= */}
      <motion.section
        id="experience"
        className="experience-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
      >

        <div className="section-container">

          <p className="small-label">EXPERIENCE</p>

          <div className="experience-heading">

            <div>

              <h2 className="section-title">
                My <span>Journey So Far</span>
              </h2>

              <p className="section-intro">
                A timeline of my learning, projects and experiences.
              </p>

            </div>

            <div className="journey-quote">
              "Every experience teaches me something new."
            </div>

          </div>

          <div className="timeline">

            <TimelineItem
              date="Jun – Aug 2025"
              title="Data Analytics Internship"
              subtitle="Data Science & Machine Learning"
              icon="bi-briefcase-fill"
              badge="Industry Experience"
              points={[
                "Worked on data cleaning, transformation, feature analysis and dynamic dashboard creation using Python, SQL and Power BI.",
                "Gained hands-on experience handling real-world datasets, calculating business KPIs, and presenting actionable metrics."
              ]}
            />

            <TimelineItem
              date="2024 – Present"
              title="Master of Computer Applications (MCA)"
              subtitle="MIT Manipal, Manipal University Karnataka"
              icon="bi-mortarboard-fill"
              badge="Postgraduate Degree"
              points={[
                "Currently pursuing MCA with specialized coursework in Advanced Algorithms, Machine Learning, Deep Learning, and Cloud Systems.",
                "Actively developing intelligent end-to-end applications, predictive models, and full-stack solutions."
              ]}
            />

            <TimelineItem
              date="Jan – May 2024"
              title="Applied AI & Data Science Projects"
              subtitle="Research & Project Implementation"
              icon="bi-diagram-3-fill"
              badge="Project Lab"
              points={[
                "Built multiple end-to-end projects in Machine Learning, exploratory data analysis, and predictive modeling.",
                "Worked with real-world Kaggle datasets and engineered statistical features with Python, Scikit-learn and Pandas."
              ]}
            />

            <TimelineItem
              date="Graduated"
              title="B.Sc in Information Technology (B.Sc IT)"
              subtitle="Passout Graduate"
              icon="bi-mortarboard-fill"
              badge="Bachelor's Degree"
              points={[
                "Graduated with a strong technical foundation in software engineering, database management systems, and object-oriented programming.",
                "Completed multiple academic capstones and developed practical software problem-solving skills."
              ]}
            />

          </div>

        </div>

      </motion.section>


      {/* ================= CERTIFICATIONS ================= */}
      <motion.section
        id="certifications"
        className="certifications-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
      >

        <div className="section-container">

          <p className="small-label">CERTIFICATES</p>

          <h2 className="section-title">
            Courses & <span>Achievements</span>
          </h2>

          <p className="section-intro">
            Some of the certifications I've completed to enhance my
            skills.
          </p>

          <div className="certificate-filter">
            {["All", "Data Science", "AI/ML", "Web Development"].map((category) => (
              <button
                key={category}
                className={certificateFilter === category ? "filter-active" : ""}
                onClick={() => setCertificateFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="certification-grid">
            {filteredCertificates.map((certificate) => (
              <Certificate
                key={certificate.title}
                icon={certificate.icon}
                title={certificate.title}
                company={certificate.company}
                category={certificate.category}
              />
            ))}
          </div>

        </div>

      </motion.section>


      {/* ================= RESUME ================= */}
      <motion.section
        id="resume"
        className="resume-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
      >

        <div className="section-container">

          <p className="small-label">MY RESUME</p>

          <h2 className="section-title">
            Take a <span>look</span>
          </h2>

          <p className="section-intro">
            Take a look at my resume to know more about my education,
            skills and experience.
          </p>

          <div className="resume-layout">

            <div className="resume-preview">

              <div className="resume-paper">

                <div className="resume-paper-header">
                  <span className="resume-badge">CURRICULUM VITAE</span>
                  <span className="resume-verified-badge">
                    <i className="bi bi-patch-check-fill"></i> Verified Candidate
                  </span>
                </div>

                <div className="resume-paper-profile">
                  <div className="resume-avatar-mini">KS</div>
                  <div>
                    <h3>Krishna Sahu</h3>
                    <p className="resume-subtitle">Aspiring Data Scientist & AI/ML Engineer</p>
                    <div className="resume-contact-pills">
                      <span><i className="bi bi-mortarboard-fill"></i> MCA @ MIT Manipal</span>
                      <span><i className="bi bi-geo-alt-fill"></i> Manipal, Karnataka</span>
                    </div>
                  </div>
                </div>

                <div className="resume-divider"></div>

                <div className="resume-columns-grid">

                  <div className="resume-col">
                    <div className="resume-section-head">
                      <i className="bi bi-mortarboard"></i>
                      <b>Education</b>
                    </div>
                    <div className="resume-item">
                      <strong>Master of Computer Applications (MCA)</strong>
                      <span>MIT Manipal, Manipal University Karnataka</span>
                      <small>2024 – Present · Specializing in Data Science & AI/ML</small>
                    </div>
                    <div className="resume-item">
                      <strong>B.Sc in Information Technology</strong>
                      <span>Passout Graduate · Software & Algorithms</span>
                    </div>
                  </div>

                  <div className="resume-col">
                    <div className="resume-section-head">
                      <i className="bi bi-cpu"></i>
                      <b>Core Skills</b>
                    </div>
                    <div className="resume-skill-tags">
                      <span>Python</span>
                      <span>Machine Learning</span>
                      <span>SQL</span>
                      <span>Power BI</span>
                      <span>NumPy & Pandas</span>
                      <span>Scikit-Learn</span>
                      <span>Data Analysis</span>
                    </div>

                    <div className="resume-section-head" style={{ marginTop: "14px" }}>
                      <i className="bi bi-trophy"></i>
                      <b>Certifications</b>
                    </div>
                    <ul className="resume-bullet-list">
                      <li>Google Data Analytics Professional</li>
                      <li>Coursera Machine Learning Specialization</li>
                      <li>Microsoft Power BI Analyst</li>
                    </ul>
                  </div>

                </div>

                <div className="resume-watermark">KRISHNA SAHU · MIT MANIPAL</div>

              </div>

            </div>


            <div className="resume-actions">

              <a
                href="/resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="resume-action"
                onClick={() => {
                  fetch("/api/analytics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      eventType: "resume_view",
                      page: "portfolio",
                      metadata: { source: "resume_section" },
                    }),
                  }).catch((error) => console.error("Resume analytics error:", error));
                }}
              >

                <div className="action-icon">
                  <i className="bi bi-file-earmark-person"></i>
                </div>

                <div>
                  <b>View Full Resume</b>
                  <span>Open PDF in new tab</span>
                </div>

              </a>


              <button
                type="button"
                className="resume-action"
                onClick={handleResumeDownload}
                style={{
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >

                <div className="action-icon">
                  <i className="bi bi-download"></i>
                </div>

                <div>
                  <b>Download Resume</b>
                  <span>Get offline PDF copy</span>
                </div>

              </button>


              <button
                type="button"
                className="resume-action"
                onClick={() => {
                  setShareResumeOpen(true);
                  setShowMoreShareOptions(false);
                  setResumePdfShareMessage("");
                  setResumePdfLinkCopied(false);
                }}
                style={{
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >

                <div className="action-icon">
                  <i className="bi bi-share"></i>
                </div>

                <div>
                  <b>Share Resume</b>
                  <span>Send direct link or file</span>
                </div>

              </button>


              <div className="resume-quote">
                <i className="bi bi-quote quote-icon"></i>
                <p>"Driven by curiosity, grounded in data, and dedicated to building real-world intelligent systems."</p>
                <div className="quote-author">— Krishna Sahu</div>
              </div>

            </div>

          </div>

        </div>

      </motion.section>


      {/* ================= RESUME PDF SHARE MODAL ================= */}
      {shareResumeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-share-title"
          onClick={() => setShareResumeOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              borderRadius: "18px",
              padding: "28px",
              background: theme === "dark" ? "#111827" : "#ffffff",
              color: theme === "dark" ? "#ffffff" : "#172033",
              boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setShareResumeOpen(false)}
              aria-label="Close resume sharing"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "36px",
                height: "36px",
                border: "none",
                borderRadius: "50%",
                background: theme === "dark" ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                color: "inherit",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div style={{ paddingRight: "40px" }}>
              <p className="small-label" style={{ marginBottom: "8px" }}>
                SHARE MY RESUME
              </p>

              <h3
                id="resume-share-title"
                style={{
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                Share Krishna's Resume PDF
              </h3>

              <p
                style={{
                  marginBottom: "22px",
                  opacity: 0.75,
                  lineHeight: 1.6,
                }}
              >
                This option shares the actual resume PDF file. It does not send your portfolio URL.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResumePdfShare}
              style={{
                width: "100%",
                padding: "15px 16px",
                border: "none",
                borderRadius: "10px",
                background: theme === "dark" ? "#ffffff" : "#172033",
                color: theme === "dark" ? "#172033" : "#ffffff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              <i className="bi bi-file-earmark-pdf" style={{ marginRight: "8px" }}></i>
              Share Actual PDF File
            </button>

            <div
              style={{
                marginTop: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#f8fafc",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              <i className="bi bi-paperclip" style={{ marginRight: "7px" }}></i>
              File: <strong>Krishna-Sahu-Resume.pdf</strong>
            </div>

            <div style={{ marginTop: "18px" }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Direct PDF Link
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  width: "100%",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border:
                    theme === "dark"
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid #dbe3ee",
                  background: theme === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc",
                }}
              >
                <input
                  type="text"
                  value={resumePdfUrl}
                  readOnly
                  aria-label="Direct resume PDF link"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "inherit",
                    padding: "11px 12px",
                    fontSize: "12px",
                  }}
                />

                <button
                  type="button"
                  onClick={handleCopyResumePdfLink}
                  style={{
                    flexShrink: 0,
                    border: "none",
                    borderLeft:
                      theme === "dark"
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "1px solid #dbe3ee",
                    background: theme === "dark" ? "#ffffff" : "#172033",
                    color: theme === "dark" ? "#172033" : "#ffffff",
                    padding: "0 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  <i
                    className={resumePdfLinkCopied ? "bi bi-check-lg" : "bi bi-copy"}
                    style={{ marginRight: "6px" }}
                  ></i>
                  {resumePdfLinkCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  opacity: 0.65,
                }}
              >
                You can copy this link and paste it into any browser to open the resume PDF directly.
              </p>
            </div>

            {resumePdfShareMessage && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "13px 14px",
                  borderRadius: "10px",
                  background: theme === "dark" ? "rgba(0, 200, 255, 0.08)" : "#eff6ff",
                  border: theme === "dark" ? "1px solid rgba(0, 200, 255, 0.18)" : "1px solid #bfdbfe",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                {resumePdfShareMessage}
              </div>
            )}

            {showMoreShareOptions && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#f8fafc",
                  border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                }}
              >
                <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                  Direct PDF sharing is unavailable here.
                </p>

                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    opacity: 0.75,
                  }}
                >
                  Download the actual PDF and attach it directly in WhatsApp, Gmail, LinkedIn, or another app.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    trackResumeShare("resume_pdf_download_fallback");
                    handleResumeDownload();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "11px 14px",
                    border: "none",
                    borderRadius: "9px",
                    background: theme === "dark" ? "#ffffff" : "#172033",
                    color: theme === "dark" ? "#172033" : "#ffffff",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <i className="bi bi-download"></i>
                  Download Resume PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CONTACT ================= */}
      <motion.section
        id="contact"
        className="contact-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
      >

        <div className="section-container">

          <div className="contact-layout">

            <div className="contact-left">

              <p className="small-label">GET IN TOUCH</p>

              <h2 className="section-title">
                Let's <span>Work Together</span>
              </h2>

              <p className="section-intro">
                Feel free to reach out for collaborations, opportunities
                or just a friendly hello.
              </p>

              <div className="contact-list">

                <ContactItem
                  icon="bi-envelope-fill"
                  title="Email"
                  text="krishnasahu@email.com"
                  copyable={true}
                />

                <ContactItem
                  icon="bi-linkedin"
                  title="LinkedIn"
                  text="linkedin.com/in/krishna-sahu"
                  link="https://linkedin.com"
                />

                <ContactItem
                  icon="bi-github"
                  title="GitHub"
                  text="github.com/krishna-sahu"
                  link="https://github.com"
                />

                <ContactItem
                  icon="bi-geo-alt-fill"
                  title="Location"
                  text="Manipal, Karnataka, India"
                />

              </div>

              <div className="contact-status-card">
                <span className="status-dot">
                  <span className="status-dot-ping"></span>
                </span>
                <div>
                  <strong>Currently Available</strong>
                  <span>Open for Data Science, Machine Learning & Analytics roles</span>
                </div>
              </div>

            </div>


            <form className="contact-form" onSubmit={handleContactSubmit}>

              <input
                type="text"
                name="portfolioWebsite"
                value={contactForm.portfolioWebsite}
                onChange={handleContactChange}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />

              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={handleContactChange}
                required
                aria-invalid={Boolean(contactFormErrors.name)}
                aria-describedby={contactFormErrors.name ? "contact-name-error" : undefined}
              />

              {contactFormErrors.name && (
                <small
                  id="contact-name-error"
                  style={{ color: "#dc3545", fontWeight: 600 }}
                >
                  {contactFormErrors.name}
                </small>
              )}

              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
                aria-invalid={Boolean(contactFormErrors.email)}
                aria-describedby={contactFormErrors.email ? "contact-email-error" : undefined}
              />

              {contactFormErrors.email && (
                <small
                  id="contact-email-error"
                  style={{ color: "#dc3545", fontWeight: 600 }}
                >
                  {contactFormErrors.email}
                </small>
              )}

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
                aria-invalid={Boolean(contactFormErrors.subject)}
                aria-describedby={contactFormErrors.subject ? "contact-subject-error" : undefined}
              />

              {contactFormErrors.subject && (
                <small
                  id="contact-subject-error"
                  style={{ color: "#dc3545", fontWeight: 600 }}
                >
                  {contactFormErrors.subject}
                </small>
              )}

              <textarea
                name="message"
                rows="6"
                placeholder="Your Message"
                value={contactForm.message}
                onChange={handleContactChange}
                required
                aria-invalid={Boolean(contactFormErrors.message)}
                aria-describedby={contactFormErrors.message ? "contact-message-error" : undefined}
              ></textarea>

              {contactFormErrors.message && (
                <small
                  id="contact-message-error"
                  style={{ color: "#dc3545", fontWeight: 600 }}
                >
                  {contactFormErrors.message}
                </small>
              )}

              <button type="submit" disabled={contactFormSubmitting}>
                {contactFormSubmitting ? "Sending..." : "Send Message"}
                <i className="bi bi-arrow-right"></i>
              </button>

              {contactFormStatus.message && (
                <p
                  style={{
                    marginTop: "15px",
                    marginBottom: 0,
                    fontWeight: 600,
                    color:
                      contactFormStatus.type === "success"
                        ? "#198754"
                        : "#dc3545",
                  }}
                  role="alert"
                >
                  {contactFormStatus.message}
                </p>
              )}

            </form>

          </div>

        </div>

      </motion.section>


      {/* ================= AI PORTFOLIO ASSISTANT ================= */}
      <div className="ai-assistant">

        {assistantOpen && (
          <div className="ai-chat-window">

            <div className="ai-chat-header">
              <div>
                <strong>AI Portfolio Assistant</strong>
                <span>Ask me about Krishna's portfolio</span>
              </div>

              <button
                type="button"
                className="ai-close-button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close AI assistant"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="ai-chat-messages">

              {assistantMessages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-message ${
                    message.role === "user"
                      ? "ai-message-user"
                      : "ai-message-bot"
                  }`}
                >
                  {message.content}

                  {message.role === "assistant" && message.action && (
                    <button
                      type="button"
                      onClick={() => handleAssistantAction(message.action.target)}
                      style={{
                        marginTop: "10px",
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      {message.action.label}
                      <i className="bi bi-arrow-right" style={{ marginLeft: "7px" }}></i>
                    </button>
                  )}

                </div>
              ))}

              {assistantLoading && (
                <div className="ai-message ai-message-bot">Thinking...</div>
              )}

            </div>

            <div className="ai-suggestions">
              <button
                type="button"
                className="ai-suggestion-chip"
                onClick={() => sendAiMessage("What are Krishna's top technical skills?")}
              >
                🛠️ Skills
              </button>
              <button
                type="button"
                className="ai-suggestion-chip"
                onClick={() => sendAiMessage("Tell me about the machine learning projects.")}
              >
                🤖 ML Projects
              </button>
              <button
                type="button"
                className="ai-suggestion-chip"
                onClick={() => sendAiMessage("How can I contact Krishna?")}
              >
                📬 Contact Info
              </button>
            </div>

            <form className="ai-chat-input" onSubmit={handleAssistantSubmit}>

              <input
                type="text"
                placeholder="Ask about Krishna..."
                value={assistantMessage}
                onChange={(event) => setAssistantMessage(event.target.value)}
                aria-label="Ask the AI portfolio assistant"
              />

              <button type="submit" aria-label="Send message">
                <i className="bi bi-send-fill"></i>
              </button>

            </form>

          </div>
        )}

        <button
          type="button"
          className="ai-assistant-button"
          onClick={() => setAssistantOpen((open) => !open)}
          aria-label="Open AI portfolio assistant"
        >
          <span className="ai-ping-ring" aria-hidden="true"></span>
          <i className={assistantOpen ? "bi bi-x-lg" : "bi bi-robot"}></i>
          <span>{assistantOpen ? "Close" : "AI Assistant"}</span>
        </button>

      </div>

      {/* ================= BACK TO TOP BUTTON ================= */}
      <button
        type="button"
        className={`back-to-top-button ${showBackToTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <i className="bi bi-chevron-up"></i>
      </button>


      {/* ================= FOOTER ================= */}
      <footer className="footer">

        <div className="footer-left">
          <strong>KS.</strong>
          <span>Building a Better Future with Data</span>
        </div>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#certifications">Certifications</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer-social">
          <i className="bi bi-linkedin"></i>
          <i className="bi bi-github"></i>
          <i className="bi bi-instagram"></i>
          <i className="bi bi-envelope"></i>
        </div>

        <span className="copyright">
          © 2025 Krishna Sahu. All rights reserved.
        </span>

      </footer>

    </>
  );
}


/* =====================================================
   SKILL COMPONENT
===================================================== */

function Skill({ name, icon, level, tag }) {
  const isAdvanced = level === "Advanced";

  return (

    <motion.div
      className="technology-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >

      <div className="technology-card-header">

        <div className="technology-icon">
          <i className={`bi ${icon}`}></i>
        </div>

        <div className={`technology-badge ${isAdvanced ? "badge-advanced" : "badge-proficient"}`}>
          <span className="technology-dot"></span>
          <span>{level || "Proficient"}</span>
        </div>

      </div>

      <div className="technology-meta">
        <strong className="technology-name">{name}</strong>
        {tag && <span className="technology-tag">{tag}</span>}
      </div>

    </motion.div>

  );
}


/* =====================================================
   PROJECT COMPONENT
===================================================== */

function ProjectCard({
  category,
  title,
  image,
  description,
  tags,
  details,
  technologies,
  github,
  liveDemo,
  onViewDetails
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = Boolean(description && description.length > 115);

  const getTruncatedText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated) + "...";
  };

  return (

    <motion.div
      className="project-card-new"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6 }}
    >

      <div className="project-image-new">
        <span className="project-category-badge">{category}</span>
        <img src={image} alt={title} loading="lazy" />
      </div>

      <div className="project-body">

        <p>{category}</p>

        <h3>{title}</h3>

        <div className="project-tags">
          {tags.map((tag, index) => (
            <span key={index}>{tag}</span>
          ))}
        </div>

        <div className="project-description-wrapper">
          <p className="project-description">
            {isLongDescription && !isExpanded
              ? getTruncatedText(description)
              : description}
          </p>

          {isLongDescription && (
            <button
              type="button"
              className="project-show-more-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? "Show Less" : "Show More"}</span>
              <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>
          )}
        </div>

        <div className="project-links">

          <button
            type="button"
            className="project-btn-details"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventType: "project_view",
                  page: "portfolio",
                  metadata: { project: title },
                }),
              }).catch((error) => console.error("Project analytics error:", error));

              onViewDetails({
                title,
                image,
                description,
                category,
                tags,
                details,
                technologies,
                github,
                liveDemo,
              });
            }}
          >
            <span>Details</span>
            <i className="bi bi-arrow-right"></i>
          </button>

          {liveDemo && (
            <a
              href={liveDemo}
              target="_blank"
              rel="noreferrer"
              className="project-btn-demo"
            >
              <span>Demo</span>
              <i className="bi bi-box-arrow-up-right"></i>
            </a>
          )}

          <a
            href={github || "#contact"}
            target={github ? "_blank" : undefined}
            rel={github ? "noreferrer" : undefined}
            className="project-btn-code"
          >
            <i className="bi bi-github"></i>
            <span>{github ? "Code" : "Request"}</span>
          </a>

        </div>

      </div>

    </motion.div>

  );
}


/* =====================================================
   TIMELINE COMPONENT
===================================================== */

function TimelineItem({ date, title, subtitle, icon, badge, points }) {

  return (

    <div className="timeline-item">

      <div className="timeline-date">
        <span>{date}</span>
        {badge && <span className="timeline-badge">{badge}</span>}
      </div>

      <div className="timeline-dot">
        <span className="timeline-dot-ping"></span>
      </div>

      <div className="timeline-card">

        <div className="timeline-icon">
          <i className={`bi ${icon}`}></i>
        </div>

        <div className="timeline-content">

          <h3>{title}</h3>

          <h4>{subtitle}</h4>

          <ul>
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>

        </div>

      </div>

    </div>

  );
}


/* =====================================================
   CERTIFICATE COMPONENT
===================================================== */

function Certificate({ icon, title, company, category }) {

  return (

    <div className="certificate-card">

      <div className="certificate-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="certificate-info">
        <span className="certificate-badge">{category}</span>
        <h3>{title}</h3>
        <p><i className="bi bi-patch-check-fill"></i> {company}</p>
      </div>

      <a
        href="#contact"
        className="certificate-link"
        onClick={() => {
          fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventType: "certificate_view",
              page: "portfolio",
              metadata: { certificate: title, company, category },
            }),
          }).catch((error) => console.error("Certificate analytics error:", error));
        }}
      >
        <span>Credential</span>
        <i className="bi bi-arrow-up-right"></i>
      </a>

    </div>

  );
}


/* =====================================================
   CONTACT COMPONENT
===================================================== */

function ContactItem({ icon, title, text, link, copyable }) {
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    if (copyable) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (link) {
      window.open(link, "_blank", "noreferrer");
    }
  };

  return (

    <div
      className={`contact-item-new ${link || copyable ? "clickable" : ""}`}
      onClick={handleAction}
      role={link || copyable ? "button" : undefined}
      tabIndex={link || copyable ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      }}
    >

      <div className="contact-icon-new">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="contact-details">
        <b>{title}</b>
        <span>{text}</span>
      </div>

      {copyable && (
        <span className="contact-action-badge">
          {copied ? (
            <><i className="bi bi-check-lg"></i> Copied</>
          ) : (
            <><i className="bi bi-clipboard"></i> Copy</>
          )}
        </span>
      )}

      {link && !copyable && (
        <span className="contact-action-badge link-arrow">
          <i className="bi bi-arrow-up-right"></i>
        </span>
      )}

    </div>

  );
}


export default App;