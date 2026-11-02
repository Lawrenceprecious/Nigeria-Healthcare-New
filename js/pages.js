(function () {
  const API_BASE = (window.HEALTHCONNECT_API_URL || "").replace(/\/$/, "");
  const $ = (id) => document.getElementById(id);
  const setMessage = (id, message, isError = false) => {
    const el = $(id);
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "#b42318" : "";
  };
  const api = async (path, options = {}) => {
    if (!API_BASE || API_BASE.includes("YOUR-RENDER-SERVICE")) {
      throw new Error("The backend URL has not been configured yet. Set it in js/api-config.js after deploying the backend.");
    }
    const token = localStorage.getItem("hc-token");
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      throw new Error("Could not reach the backend. Check the backend URL and try again.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const q = new URLSearchParams(location.search);
    const role = q.get("role");
    if (role && $("accountRole")) $("accountRole").value = role;

    const login = $("loginForm");
    login?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = login.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setMessage("loginMessage", "Signing you in…");
      try {
        const result = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: login.elements.email.value.trim(), password: login.elements.password.value })
        });
        localStorage.setItem("hc-token", result.token);
        localStorage.setItem("hc-user", JSON.stringify(result.user));
        localStorage.removeItem("hc-demo-session");
        setMessage("loginMessage", "Sign-in successful. Redirecting…");
        const next = q.get("next");
        const destination = next && !next.startsWith("//") && !/^[a-z]+:/i.test(next) ? next : "patient/dashboard.html";
        setTimeout(() => { location.href = destination; }, 300);
      } catch (error) {
        setMessage("loginMessage", error.message, true);
      } finally {
        if (button) button.disabled = false;
      }
    });

    const reg = $("registerForm");
    reg?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = reg.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setMessage("registerMessage", "Creating your account…");
      const selectedRole = reg.elements.role?.value || "patient";
      // Public registration never grants administrator privileges. Doctor/facility accounts are provider accounts.
      const accountRole = selectedRole === "patient" ? "patient" : "provider";
      try {
        const result = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: reg.elements.name.value.trim(),
            phone: reg.elements.phone?.value.trim() || "",
            email: reg.elements.email.value.trim(),
            password: reg.elements.password.value,
            role: accountRole
          })
        });
        localStorage.setItem("hc-token", result.token);
        localStorage.setItem("hc-user", JSON.stringify(result.user));
        localStorage.removeItem("hc-demo-session");
        setMessage("registerMessage", "Account created successfully. Redirecting…");
        const destination = result.user.role === "provider" ? "facility/dashboard.html" : "patient/dashboard.html";
        setTimeout(() => { location.href = destination; }, 350);
      } catch (error) {
        setMessage("registerMessage", error.message, true);
      } finally {
        if (button) button.disabled = false;
      }
    });

    const bookingForm = $("bookingForm");
    const facilitySelect = $("bookingFacility");
    if (facilitySelect) {
      api("/api/facilities").then(({ facilities = [] }) => {
        facilitySelect.innerHTML = '<option value="">Choose a verified healthcare provider</option>';
        facilities.forEach((facility) => {
          const option = document.createElement("option");
          option.value = facility._id;
          option.textContent = `${facility.name} — ${facility.city}`;
          facilitySelect.appendChild(option);
        });
        if (!facilities.length) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No verified providers available yet";
          option.disabled = true;
          facilitySelect.appendChild(option);
        }
        const requested = q.get("facilityId");
        if (requested) facilitySelect.value = requested;
      }).catch((error) => {
        if (facilitySelect.options.length <= 1) {
          facilitySelect.innerHTML = '<option value="">Providers could not be loaded</option>';
        }
        setMessage("bookingMessage", error.message, true);
      });
    }
    bookingForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(bookingForm));
      setMessage("bookingMessage", "Submitting appointment request…");
      try {
        await api("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            facilityId: facilitySelect?.value,
            preferredDate: data.date,
            preferredTime: data.time,
            generalReason: data.reason || ""
          })
        });
        setMessage("bookingMessage", "Your appointment request has been submitted. The provider must confirm it.");
        bookingForm.reset();
      } catch (error) {
        setMessage("bookingMessage", error.message, true);
      }
    });

    const search = $("facilitySearch"), type = $("facilityType");
    const cards = [...document.querySelectorAll('#facilityCards [data-name]')];
    function filterFacilities() {
      if (!cards.length) return;
      let count = 0;
      cards.forEach((card) => {
        const matches = card.dataset.name.includes((search?.value || "").toLowerCase()) && (type?.value === "all" || card.dataset.type === type?.value);
        card.hidden = !matches;
        if (matches) count++;
      });
      const noResults = $("noFacilities");
      if (noResults) noResults.hidden = count > 0;
    }
    $("searchFacilities")?.addEventListener("click", filterFacilities);
    search?.addEventListener("input", filterFacilities);
    type?.addEventListener("change", filterFacilities);
  });
})();
