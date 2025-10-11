// --------------------- Modal Functions ---------------------
function openLogin() {
  document.getElementById("loginModal").style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function switchModal(from, to) {
  closeModal(from);
  document.getElementById(to).style.display = "block";
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

// --------------------- Dynamic Counts ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const projRes = await fetch("http://localhost:5000/projects");
    const projects = await projRes.json();
    const totalProjectsElement = document.getElementById("totalProjects");
    if (totalProjectsElement) {
      totalProjectsElement.textContent = Array.isArray(projects) ? projects.length : "-";
    }

    const usersRes = await fetch("http://localhost:5000/users");
    const users = await usersRes.json();
    const studentCountElement = document.getElementById("studentsCount");
    if (studentCountElement) {
      studentCountElement.textContent = Array.isArray(users) ? users.length : "-";
    }
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
});

// --------------------- Signup ---------------------
async function signupUser() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      closeModal("signupModal");
      openLogin();
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("Error signing up. Please try again.");
  }
}

// --------------------- Login ---------------------
async function loginUser() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      closeModal("loginModal");
      localStorage.setItem("loggedInUser", username);

      const navBtn = document.querySelector("nav button");
      navBtn.innerText = "Logout";
      navBtn.onclick = logoutUser;
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Error logging in. Please try again.");
  }
}

// --------------------- Logout ---------------------
function logoutUser() {
  localStorage.removeItem("loggedInUser");
  const navBtn = document.querySelector("nav button");
  navBtn.innerText = "Login";
  navBtn.onclick = openLogin;
  window.location.href = "home.html";
}

// --------------------- Persist Login State ---------------------
document.addEventListener("DOMContentLoaded", () => {
  const navBtn = document.querySelector("nav button");
  const loggedInUser = localStorage.getItem("loggedInUser");

  if (navBtn) {
    if (loggedInUser) {
      navBtn.innerText = "Logout";
      navBtn.onclick = logoutUser;
    } else {
      navBtn.innerText = "Login";
      navBtn.onclick = openLogin;
    }
  }
});

// --------------------- File Upload (Show Name) ---------------------
const fileInput = document.getElementById("projectFile");
if (fileInput) {
  const fileName = document.querySelector(".file-name");
  fileInput.addEventListener("change", () => {
    fileName.textContent =
      fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
  });
}

// --------------------- Submit Project ---------------------
async function handleSubmitProject(event) {
  event.preventDefault();
  const loggedInUser = localStorage.getItem("loggedInUser");

  if (!loggedInUser) {
    alert("You must login before submitting a project.");
    openLogin();
    return;
  }

  const title = document.getElementById("projectTitle").value.trim();
  const year = document.getElementById("projectYear").value;
  const tech = document.getElementById("projectTech").value.trim();
  const contributors = document.getElementById("projectContributors").value.trim();
  const summary = document.getElementById("projectSummary").value.trim();
  const category = document.getElementById("projectCategory").value;
  const github = document.getElementById("projectGithub").value.trim();
  const file = document.getElementById("projectFile").files[0];

  if (!title || !year || !tech || !contributors || !summary || !category) {
    alert("Please fill all required fields.");
    return;
  }

  if (file && file.size > 5 * 1024 * 1024) {
    alert("File size must be less than 5 MB.");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("year", year);
  formData.append("tech", tech);
  formData.append("contributors", contributors);
  formData.append("summary", summary);
  formData.append("category", category);
  formData.append("github", github);
  if (file) formData.append("file", file);
  formData.append("username", loggedInUser);

  try {
    const res = await fetch("http://localhost:5000/submit-project", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      event.target.reset();
      document.querySelector(".file-name").textContent = "No file chosen";
    }
  } catch (err) {
    console.error("Submit project error:", err);
    alert("Error submitting project. Please try again.");
  }
}

// --------------------- Project Render & Filter ---------------------
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get("search");

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const yearFilter = document.getElementById("searchYear");

  if (searchParam && searchInput) {
    searchInput.value = searchParam;
  }

  fetchAndRenderProjects();

  if (searchInput) searchInput.addEventListener("input", fetchAndRenderProjects);
  if (categoryFilter) categoryFilter.addEventListener("change", fetchAndRenderProjects);
  if (yearFilter) yearFilter.addEventListener("input", fetchAndRenderProjects);
});

async function fetchAndRenderProjects() {
  try {
    const res = await fetch("http://localhost:5000/projects");
    const projects = await res.json();

    const searchText = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
    const selectedCategory = document.getElementById("categoryFilter")?.value || "All Categories";
    const selectedYear = document.getElementById("searchYear")?.value.trim() || "";

    const filtered = projects.filter((proj) => {
      const matchesSearch = [proj.title, proj.contributors, proj.summary, proj.tech, proj.category]
        .some(val => val && val.toLowerCase().includes(searchText));

      const matchesCategory = selectedCategory === "All Categories" || proj.category === selectedCategory;

      // ✅ Allow partial year search
      const matchesYear = selectedYear === "" || proj.year.toString().startsWith(selectedYear);

      return matchesSearch && matchesCategory && matchesYear;
    });

    const projectsCountElem = document.getElementById("projectsCount");
    if (projectsCountElem) {
      projectsCountElem.textContent = `Showing ${filtered.length} of ${projects.length} projects`;
    }

    const grid = document.getElementById("projectsGrid");
    if (grid) {
      grid.innerHTML =
        filtered.map(proj => `
          <div class="project-card">
            <h3>${escapeHTML(proj.title)} <span class="year-badge">${escapeHTML(proj.year)}</span></h3>
            <p><strong>${escapeHTML(proj.category)}</strong></p>
            <div class="tags">
              ${escapeHTML(proj.tech).split(',').map(t => `<span>${t.trim()}</span>`).join('')}
            </div>
            <p>${escapeHTML(proj.summary)}</p>
            <p class="contributors">👥 ${escapeHTML(proj.contributors)}</p>
            <div class="card-links">
              ${proj.github ? `<a href="${escapeHTML(proj.github)}" target="_blank"><button>🔗 GitHub</button></a>` : ''}
              ${proj.filePath ? `<a href="${proj.filePath}" target="_blank"><button>📄 Docs</button></a>` : ''}
            </div>
          </div>
        `).join("") || `<div class="center small">No projects found.</div>`;
    }

  } catch (err) {
    console.error("Error loading projects:", err);
    const grid = document.getElementById("projectsGrid");
    if (grid) {
      grid.innerHTML = `<div class="center small">Error loading projects.</div>`;
    }
  }
}

// --------------------- Utility: Escape HTML ---------------------
function escapeHTML(str) {
  return (str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
