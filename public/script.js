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
    const res = await fetch("http://localhost:5000/projects");
    const projects = await res.json();

    const totalProjectsElement = document.getElementById("totalProjects");
    if (totalProjectsElement) {
      totalProjectsElement.textContent =
        projects.length > 0 ? projects.length : "-";
    }

    const studentCountElement = document.getElementById("studentsCount");
    if (studentCountElement) {
      const contributors = new Set();
      projects.forEach((p) =>
        p.contributors?.split(",").forEach((c) => contributors.add(c.trim()))
      );
      studentCountElement.textContent =
        contributors.size > 0 ? contributors.size : "-";
    }
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
});

// --------------------- Signup ---------------------
async function signupUser() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document
    .getElementById("signupConfirmPassword")
    .value.trim();

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
  const contributors = document
    .getElementById("projectContributors")
    .value.trim();
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
  if (file) formData.append("file", file); // ✅ match backend field name
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
