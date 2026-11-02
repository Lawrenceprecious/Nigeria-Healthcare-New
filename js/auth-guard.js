/* Basic frontend navigation gate. The API remains responsible for authorizing protected data/actions. */
(function () {
  const token = localStorage.getItem("hc-token");
  if (!token) {
    const next = location.pathname + location.search;
    location.replace("../login.html?next=" + encodeURIComponent(next));
  }
  window.healthConnectSignOut = function () {
    localStorage.removeItem("hc-token");
    localStorage.removeItem("hc-user");
    localStorage.removeItem("hc-demo-session");
    location.href = "../login.html";
  };
})();
