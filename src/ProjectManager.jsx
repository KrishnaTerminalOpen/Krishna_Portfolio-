import { useEffect, useState } from "react";
import "./ProjectManager.css";

const emptyForm = {
  title: "",
  category: "",
  description: "",
  image: "",
  technologies: "",
  details: "",
  github: "",
  liveDemo: "",
  featured: false,
  order: 0,
};

function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/projects"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load projects."
        );
      }

      setProjects(data.projects || []);
    } catch (err) {
      console.error("Load projects error:", err);

      setError(
        "Unable to load projects. Make sure your backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // =========================================================
  // HANDLE FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
    setSelectedImageName("");
    setMessage("");
    setError("");
  };

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file."));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 800;

          let width = image.width;
          let height = image.height;

          const scale = Math.min(
            1,
            maxWidth / width,
            maxHeight / height
          );

          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Could not process the selected image."));
            return;
          }

          context.drawImage(image, 0, 0, width, height);

          const compressed = canvas.toDataURL(
            "image/jpeg",
            0.78
          );

          if (compressed.length > 1800000) {
            reject(
              new Error(
                "Image is still too large. Please choose a smaller image."
              )
            );
            return;
          }

          resolve(compressed);
        };

        image.onerror = () => {
          reject(new Error("The selected image could not be read."));
        };

        image.src = reader.result;
      };

      reader.onerror = () => {
        reject(new Error("The image could not be uploaded."));
      };

      reader.readAsDataURL(file);
    });

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setMessage("Processing image...");
      setError("");

      const compressedImage = await compressImage(file);

      setForm((previous) => ({
        ...previous,
        image: compressedImage,
      }));

      setSelectedImageName(file.name);
      setMessage("Image ready to upload.");
    } catch (err) {
      console.error("Image upload error:", err);

      setError(
        err.message || "Could not process the selected image."
      );

      event.target.value = "";
    }
  };

  // =========================================================
  // ADD / UPDATE PROJECT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Project category is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Project description is required.");
      return;
    }

    try {
      setSaving(true);

      const projectData = {
        title: form.title.trim(),

        category: form.category.trim(),

        description:
          form.description.trim(),

        image:
          form.image.trim(),

        technologies:
          form.technologies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

        details:
          form.details.trim(),

        github:
          form.github.trim(),

        liveDemo:
          form.liveDemo.trim(),

        featured:
          form.featured,

        order:
          Number(form.order) || 0,
      };

      const url = editingId
        ? `http://localhost:5000/api/projects/${editingId}`
        : "http://localhost:5000/api/projects";

      const method = editingId
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(projectData),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save project."
        );
      }

      if (editingId) {
        setMessage(
          "Project updated successfully."
        );
      } else {
        setMessage(
          "Project added successfully."
        );
      }

      resetForm();

      await loadProjects();

    } catch (err) {
      console.error(
        "Save project error:",
        err
      );

      setError(
        err.message ||
          "Failed to save project."
      );

    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT PROJECT
  // =========================================================

  const handleEdit = (project) => {
    setEditingId(project._id);

    setForm({
      title:
        project.title || "",

      category:
        project.category || "",

      description:
        project.description || "",

      image:
        project.image || "",

      technologies:
        Array.isArray(
          project.technologies
        )
          ? project.technologies.join(
              ", "
            )
          : "",

      details:
        project.details || "",

      github:
        project.github || "",

      liveDemo:
        project.liveDemo || "",

      featured:
        Boolean(
          project.featured
        ),

      order:
        project.order || 0,
    });

    setSelectedImageName(
      project.image
        ? project.image.startsWith("data:image/")
          ? "Existing uploaded image"
          : "Existing image URL"
        : ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE PROJECT
  // =========================================================

  const handleDelete = async (
    projectId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this project?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response =
        await fetch(
          `http://localhost:5000/api/projects/${projectId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete project."
        );
      }

      setMessage(
        "Project deleted successfully."
      );

      if (
        editingId === projectId
      ) {
        resetForm();
      }

      await loadProjects();

    } catch (err) {
      console.error(
        "Delete project error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete project."
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="project-manager">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="project-manager-header">

        <div>

          <p className="project-manager-eyebrow">
            PORTFOLIO ADMIN
          </p>

          <h1>
            Project Manager
          </h1>

          <p className="project-manager-subtitle">
            Add, edit and manage the projects
            displayed on your portfolio.
          </p>

        </div>

        <div className="project-manager-count">

          <span>
            {projects.length}
          </span>

          <small>
            Projects
          </small>

        </div>

      </div>


      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {message && (
        <div className="project-manager-message success">
          {message}
        </div>
      )}


      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && (
        <div className="project-manager-message error">
          {error}
        </div>
      )}


      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      <div className="project-manager-card">

        <div className="project-manager-card-header">

          <div>

            <h2>
              {editingId
                ? "Edit Project"
                : "Add New Project"}
            </h2>

            <p>
              Enter the project information below.
            </p>

          </div>


          {editingId && (
            <button
              type="button"
              className="project-cancel-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}

        </div>


        <form
          className="project-manager-form"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              PROJECT TITLE
          ================================================= */}

          <div className="project-form-group">

            <label>
              Project Title *
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: Expense Tracker"
            />

          </div>


          {/* =================================================
              CATEGORY
          ================================================= */}

          <div className="project-form-group">

            <label>
              Category *
            </label>

            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Example: Web Development"
            />

          </div>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="project-form-group full-width">

            <label>
              Short Description *
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write a short description of the project..."
              rows="4"
            />

          </div>


          {/* =================================================
              IMAGE
          ================================================= */}

          <div className="project-form-group full-width">

            <label>
              Project Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <small>
              Select an image from your computer, Android or iPhone.
              The image is compressed before it is saved.
            </small>

            {selectedImageName && (
              <small>
                Selected image: {selectedImageName}
              </small>
            )}

            {form.image && (
              <div style={{ marginTop: "12px" }}>
                <img
                  src={form.image}
                  alt="Project preview"
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    display: "block",
                  }}
                />
              </div>
            )}

          </div>


          {/* =================================================
              TECHNOLOGIES
          ================================================= */}

          <div className="project-form-group full-width">

            <label>
              Technologies
            </label>

            <input
              type="text"
              name="technologies"
              value={form.technologies}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB, Express"
            />

            <small>
              Separate technologies with commas.
            </small>

          </div>


          {/* =================================================
              PROJECT DETAILS
          ================================================= */}

          <div className="project-form-group full-width">

            <label>
              Project Details
            </label>

            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Write the detailed information that should appear inside the project details modal..."
              rows="6"
            />

          </div>


          {/* =================================================
              GITHUB
          ================================================= */}

          <div className="project-form-group">

            <label>
              GitHub URL
            </label>

            <input
              type="url"
              name="github"
              value={form.github}
              onChange={handleChange}
              placeholder="https://github.com/username/project"
            />

          </div>


          {/* =================================================
              LIVE DEMO
          ================================================= */}

          <div className="project-form-group">

            <label>
              Live Demo URL
            </label>

            <input
              type="url"
              name="liveDemo"
              value={form.liveDemo}
              onChange={handleChange}
              placeholder="https://your-project.vercel.app"
            />

          </div>


          {/* =================================================
              DISPLAY ORDER
          ================================================= */}

          <div className="project-form-group">

            <label>
              Display Order
            </label>

            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              min="0"
            />

            <small>
              Lower numbers appear first.
            </small>

          </div>


          {/* =================================================
              FEATURED
          ================================================= */}

          <div className="project-form-group checkbox-group">

            <label className="project-featured-label">

              <input
                type="checkbox"
                name="featured"
                checked={
                  form.featured
                }
                onChange={
                  handleChange
                }
              />

              <span>
                Featured Project
              </span>

            </label>

            <small>
              Featured projects are displayed
              before normal projects.
            </small>

          </div>


          {/* =================================================
              FORM BUTTONS
          ================================================= */}

          <div className="project-form-actions">

            <button
              type="submit"
              className="project-save-button"
              disabled={saving}
            >

              {saving
                ? "Saving..."
                : editingId
                ? "Update Project"
                : "Add Project"}

            </button>


            {editingId && (
              <button
                type="button"
                className="project-secondary-button"
                onClick={resetForm}
              >
                Clear Form
              </button>
            )}

          </div>

        </form>

      </div>


      {/* =====================================================
          EXISTING PROJECTS
      ===================================================== */}

      <div className="project-manager-card">

        <div className="project-manager-card-header">

          <div>

            <h2>
              Existing Projects
            </h2>

            <p>
              Manage the projects currently stored
              in your portfolio database.
            </p>

          </div>


          <button
            type="button"
            className="project-refresh-button"
            onClick={loadProjects}
          >
            Refresh
          </button>

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="project-manager-loading">
            Loading projects...
          </div>

        ) : projects.length === 0 ? (

          /* =================================================
             NO PROJECTS
          ================================================= */

          <div className="project-manager-empty">

            <div className="project-empty-icon">
              +
            </div>

            <h3>
              No projects yet
            </h3>

            <p>
              Add your first project using
              the form above.
            </p>

          </div>

        ) : (

          /* =================================================
             PROJECT LIST
          ================================================= */

          <div className="project-admin-list">

            {projects.map(
              (project) => (

                <div
                  className="project-admin-item"
                  key={project._id}
                >

                  <div className="project-admin-info">

                    {/* PROJECT IMAGE */}

                    {project.image ? (

                      <img
                        src={project.image}
                        alt={project.title}
                        className="project-admin-image"
                      />

                    ) : (

                      <div className="project-admin-image project-admin-image-placeholder">

                        {project.title
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "P"}

                      </div>

                    )}


                    {/* PROJECT INFORMATION */}

                    <div>

                      <div className="project-admin-title-row">

                        <h3>
                          {project.title}
                        </h3>


                        {project.featured && (
                          <span className="project-featured-badge">
                            Featured
                          </span>
                        )}

                      </div>


                      <p className="project-admin-category">
                        {project.category}
                      </p>


                      <p className="project-admin-description">
                        {project.description}
                      </p>


                      {/* TECHNOLOGIES */}

                      <div className="project-admin-technologies">

                        {project.technologies?.map(
                          (
                            technology,
                            index
                          ) => (

                            <span
                              key={`${technology}-${index}`}
                            >
                              {technology}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  </div>


                  {/* ACTION BUTTONS */}

                  <div className="project-admin-actions">

                    <button
                      type="button"
                      className="project-edit-button"
                      onClick={() =>
                        handleEdit(
                          project
                        )
                      }
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      className="project-delete-button"
                      onClick={() =>
                        handleDelete(
                          project._id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default ProjectManager;