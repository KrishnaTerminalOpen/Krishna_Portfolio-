import { useEffect, useState } from "react";
import "./AnalyticsDashboard.css";

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    aiMessages: 0,
    projectViews: 0,
    resumeViews: 0,
    resumeDownloads: 0,
    certificateViews: 0,
    contactSubmissions: 0,
    aiActionClicks: 0,
    aiActionBreakdown: [],
    mostViewedProjects: [],
    dailyAnalytics: [],
    engagementInsights: {
      mostPopularInteraction: {
        label: "No interactions yet",
        count: 0,
      },
      mostViewedProject: "No project views yet",
      resumeDownloadRate: 0,
      contactConversionRate: 0,
      aiEngagementRate: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  const loadAnalytics = (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    fetch("http://localhost:5000/api/analytics/summary")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load analytics.");
        }

        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setAnalytics(data.analytics);
          setLastUpdated(new Date());
        } else {
          throw new Error("Failed to load analytics.");
        }

        setLoading(false);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error("Analytics dashboard error:", error);
        setError("Unable to load analytics data.");
        setLoading(false);
        setRefreshing(false);
      });
  };

  const exportAnalytics = () => {
    const rows = [
      ["Metric", "Value"],
      ["Page Views", analytics.pageViews],
      ["AI Messages", analytics.aiMessages],
      ["Project Views", analytics.projectViews],
      ["Resume Views", analytics.resumeViews],
      ["Resume Downloads", analytics.resumeDownloads],
      ["Certificate Views", analytics.certificateViews],
      ["Contact Submissions", analytics.contactSubmissions],
      ["AI Action Clicks", analytics.aiActionClicks || 0],
      [],
      [
        "Most Popular Interaction",
        analytics.engagementInsights?.mostPopularInteraction?.label ||
          "No interactions yet",
      ],
      [
        "Most Popular Interaction Count",
        analytics.engagementInsights?.mostPopularInteraction?.count || 0,
      ],
      [
        "Most Viewed Project",
        analytics.engagementInsights?.mostViewedProject ||
          "No project views yet",
      ],
      [
        "Resume Download Rate",
        `${analytics.engagementInsights?.resumeDownloadRate || 0}%`,
      ],
      [
        "Contact Conversion Rate",
        `${analytics.engagementInsights?.contactConversionRate || 0}%`,
      ],
      [
        "AI Engagement Rate",
        `${analytics.engagementInsights?.aiEngagementRate || 0}%`,
      ],
      [],
      ["Most Viewed Projects"],
      ["Project", "Views"],
    ];

    analytics.mostViewedProjects.forEach((project) => {
      rows.push([project.project, project.views]);
    });

    rows.push([]);
    rows.push(["AI Assistant Actions"]);
    rows.push(["Action", "Clicks"]);

    (analytics.aiActionBreakdown || []).forEach((item) => {
      rows.push([item.action, item.clicks]);
    });

    rows.push([]);
    rows.push(["Daily Analytics"]);
    rows.push([
      "Date",
      "Page Views",
      "AI Messages",
      "Project Views",
      "Resume Views",
      "Resume Downloads",
      "Certificate Views",
      "Contact Submissions",
    ]);

    analytics.dailyAnalytics.forEach((day) => {
      rows.push([
        day.date,
        day.pageViews,
        day.aiMessages,
        day.projectViews,
        day.resumeViews,
        day.resumeDownloads,
        day.certificateViews,
        day.contactSubmissions,
      ]);
    });

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const cell =
              value === undefined || value === null ? "" : value;

            return `"${String(cell).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `portfolio-analytics-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const cards = [
    {
      title: "Page Views",
      value: analytics.pageViews,
      icon: "bi-eye",
    },
    {
      title: "AI Messages",
      value: analytics.aiMessages,
      icon: "bi-robot",
    },
    {
      title: "Project Views",
      value: analytics.projectViews,
      icon: "bi-folder2-open",
    },
    {
      title: "Resume Views",
      value: analytics.resumeViews,
      icon: "bi-file-earmark-person",
    },
    {
      title: "Resume Downloads",
      value: analytics.resumeDownloads,
      icon: "bi-download",
    },
    {
      title: "Certificate Views",
      value: analytics.certificateViews,
      icon: "bi-award",
    },
    {
      title: "Contact Submissions",
      value: analytics.contactSubmissions,
      icon: "bi-envelope",
    },
    {
      title: "AI Action Clicks",
      value: analytics.aiActionClicks || 0,
      icon: "bi-cursor",
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const activityTypes = [
    {
      key: "pageViews",
      label: "Page Views",
    },
    {
      key: "aiMessages",
      label: "AI Messages",
    },
    {
      key: "projectViews",
      label: "Project Views",
    },
    {
      key: "resumeViews",
      label: "Resume Views",
    },
    {
      key: "certificateViews",
      label: "Certificates",
    },
    {
      key: "contactSubmissions",
      label: "Contacts",
    },
  ];

  const getDailyMaximum = () => {
    let maximum = 0;

    analytics.dailyAnalytics.forEach((day) => {
      activityTypes.forEach((type) => {
        if (day[type.key] > maximum) {
          maximum = day[type.key];
        }
      });
    });

    return maximum || 1;
  };

  const dailyMaximum = getDailyMaximum();

  const insights = analytics.engagementInsights || {
    mostPopularInteraction: {
      label: "No interactions yet",
      count: 0,
    },
    mostViewedProject: "No project views yet",
    resumeDownloadRate: 0,
    contactConversionRate: 0,
    aiEngagementRate: 0,
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">
          <i className="bi bi-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">

      {/* ================= HEADER ================= */}

      <div className="analytics-header">

        <div>
          <p className="analytics-label">
            PORTFOLIO ANALYTICS
          </p>

          <h1>
            Analytics Dashboard
          </h1>

          <p className="analytics-description">
            Track how visitors interact with your portfolio.
          </p>
        </div>

        <div className="analytics-header-actions">

          <button
            className="analytics-refresh-button"
            onClick={exportAnalytics}
          >
            <i className="bi bi-download"></i>
            Export
          </button>

          <button
            className="analytics-refresh-button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <i
              className={`bi ${
                refreshing
                  ? "bi-arrow-repeat analytics-refresh-spin"
                  : "bi-arrow-clockwise"
              }`}
            ></i>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div className="analytics-status">
            <span className="analytics-status-dot"></span>
            Live Data
          </div>

          {lastUpdated && (
            <div className="analytics-last-updated">
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          )}

        </div>
      </div>


      {/* ================= ANALYTICS CARDS ================= */}

      <div className="analytics-grid">

        {cards.map((card) => (

          <div
            className="analytics-card"
            key={card.title}
          >

            <div className="analytics-card-top">

              <div className="analytics-card-icon">
                <i className={`bi ${card.icon}`}></i>
              </div>

            </div>

            <p className="analytics-card-title">
              {card.title}
            </p>

            <h2 className="analytics-card-value">
              {card.value}
            </h2>

          </div>

        ))}

      </div>


      {/* ================= MOST VIEWED PROJECTS ================= */}

      <section className="analytics-projects">

        <div className="analytics-section-header">

          <div>

            <p className="analytics-section-label">
              PROJECT INSIGHTS
            </p>

            <h2>
              Most Viewed Projects
            </h2>

            <p>
              Projects receiving the most attention from visitors.
            </p>

          </div>

          <div className="analytics-section-icon">
            <i className="bi bi-bar-chart-line"></i>
          </div>

        </div>


        {analytics.mostViewedProjects &&
        analytics.mostViewedProjects.length > 0 ? (

          <div className="analytics-project-list">

            {analytics.mostViewedProjects.map(
              (project, index) => {

                const highestViews =
                  analytics.mostViewedProjects[0]?.views || 1;

                const width =
                  (project.views / highestViews) * 100;

                return (

                  <div
                    className="analytics-project-row"
                    key={project.project}
                  >

                    <div className="analytics-project-rank">
                      {index + 1}
                    </div>

                    <div className="analytics-project-info">

                      <strong>
                        {project.project}
                      </strong>

                      <div className="analytics-project-bar">

                        <span
                          style={{
                            width: `${width}%`,
                          }}
                        ></span>

                      </div>

                    </div>

                    <div className="analytics-project-views">

                      <strong>
                        {project.views}
                      </strong>

                      <span>
                        views
                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="analytics-no-projects">

            <i className="bi bi-folder2-open"></i>

            <p>
              No project views recorded yet.
            </p>

          </div>

        )}

      </section>


      {/* ================= AI ASSISTANT ACTIONS ================= */}

      <section className="analytics-projects">

        <div className="analytics-section-header">

          <div>

            <p className="analytics-section-label">
              AI ASSISTANT
            </p>

            <h2>
              Assistant Actions
            </h2>

            <p>
              See which actions visitors choose after interacting with the AI assistant.
            </p>

          </div>

          <div className="analytics-section-icon">
            <i className="bi bi-robot"></i>
          </div>

        </div>


        {analytics.aiActionBreakdown &&
        analytics.aiActionBreakdown.length > 0 ? (

          <div className="analytics-project-list">

            {analytics.aiActionBreakdown.map(
              (item, index) => {

                const highestClicks =
                  analytics.aiActionBreakdown[0]?.clicks || 1;

                const width =
                  (item.clicks / highestClicks) * 100;

                return (

                  <div
                    className="analytics-project-row"
                    key={item.action}
                  >

                    <div className="analytics-project-rank">
                      {index + 1}
                    </div>

                    <div className="analytics-project-info">

                      <strong>
                        {item.action}
                      </strong>

                      <div className="analytics-project-bar">

                        <span
                          style={{
                            width: `${width}%`,
                          }}
                        ></span>

                      </div>

                    </div>

                    <div className="analytics-project-views">

                      <strong>
                        {item.clicks}
                      </strong>

                      <span>
                        clicks
                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="analytics-no-projects">

            <i className="bi bi-robot"></i>

            <p>
              No AI assistant action clicks recorded yet.
            </p>

          </div>

        )}

      </section>


      {/* ================= VISITOR ACTIVITY ================= */}

      <section className="analytics-activity">

        <div className="analytics-section-header">

          <div>

            <p className="analytics-section-label">
              VISITOR ACTIVITY
            </p>

            <h2>
              Activity Over Time
            </h2>

            <p>
              Recent portfolio activity from the last 7 days.
            </p>

          </div>

          <div className="analytics-section-icon">
            <i className="bi bi-activity"></i>
          </div>

        </div>


        {analytics.dailyAnalytics &&
        analytics.dailyAnalytics.length > 0 ? (

          <div className="analytics-activity-chart">

            {analytics.dailyAnalytics.map((day) => (

              <div
                className="analytics-activity-day"
                key={day.date}
              >

                <div className="analytics-activity-bars">

                  {activityTypes.map((type) => {

                    const value = day[type.key] || 0;

                    const height =
                      value === 0
                        ? 0
                        : Math.max(
                            (value / dailyMaximum) * 100,
                            8
                          );

                    return (

                      <div
                        className="analytics-activity-bar-wrapper"
                        key={type.key}
                        title={`${type.label}: ${value}`}
                      >

                        <span
                          className="analytics-activity-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        ></span>

                      </div>

                    );

                  })}

                </div>


                <div className="analytics-activity-date">
                  {formatDate(day.date)}
                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="analytics-no-activity">

            <i className="bi bi-bar-chart"></i>

            <p>
              No visitor activity recorded yet.
            </p>

          </div>

        )}


        {analytics.dailyAnalytics &&
        analytics.dailyAnalytics.length > 0 && (

          <div className="analytics-activity-legend">

            {activityTypes.map((type) => (

              <div
                className="analytics-activity-legend-item"
                key={type.key}
              >

                <span className="analytics-legend-dot"></span>

                <span>
                  {type.label}
                </span>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ================= ENGAGEMENT INSIGHTS ================= */}

      <section className="analytics-insights">

        <div className="analytics-section-header">

          <div>

            <p className="analytics-section-label">
              ENGAGEMENT INSIGHTS
            </p>

            <h2>
              Visitor Engagement
            </h2>

            <p>
              A quick overview of what visitors are most interested in.
            </p>

          </div>

          <div className="analytics-section-icon">
            <i className="bi bi-lightbulb"></i>
          </div>

        </div>


        <div className="analytics-insights-grid">

          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <i className="bi bi-hand-index-thumb"></i>
            </div>

            <div>

              <p className="analytics-insight-label">
                Most Popular Interaction
              </p>

              <h3>
                {insights.mostPopularInteraction.label}
              </h3>

              <span>
                {insights.mostPopularInteraction.count} interactions
              </span>

            </div>

          </div>


          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <i className="bi bi-folder2-open"></i>
            </div>

            <div>

              <p className="analytics-insight-label">
                Most Viewed Project
              </p>

              <h3>
                {insights.mostViewedProject}
              </h3>

              <span>
                Highest project interest
              </span>

            </div>

          </div>


          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <i className="bi bi-file-earmark-arrow-down"></i>
            </div>

            <div>

              <p className="analytics-insight-label">
                Resume Download Rate
              </p>

              <h3>
                {insights.resumeDownloadRate}%
              </h3>

              <span>
                Downloads compared with resume views
              </span>

            </div>

          </div>


          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <i className="bi bi-envelope-check"></i>
            </div>

            <div>

              <p className="analytics-insight-label">
                Contact Conversion
              </p>

              <h3>
                {insights.contactConversionRate}%
              </h3>

              <span>
                Contact submissions compared with page views
              </span>

            </div>

          </div>


          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <i className="bi bi-robot"></i>
            </div>

            <div>

              <p className="analytics-insight-label">
                AI Engagement
              </p>

              <h3>
                {insights.aiEngagementRate}%
              </h3>

              <span>
                AI interactions compared with page views
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default AnalyticsDashboard;