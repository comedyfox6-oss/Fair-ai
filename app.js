function enterApp() {
  const welcome = document.getElementById("welcome");
  const app = document.getElementById("app");

  if (!welcome || !app) {
    alert("Fair: не найдены элементы приложения");
    return;
  }

  welcome.classList.add("hidden");
  app.classList.remove("hidden");

  renderHome();
}

document.getElementById("guestLogin").addEventListener("click", enterApp);
document.getElementById("googleLogin").addEventListener("click", enterApp);
