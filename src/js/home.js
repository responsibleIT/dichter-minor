const home = document.querySelector("[data-home]");
const homeBtn = document.querySelector("[data-home-btn]");

homeBtn.addEventListener("click", () => {
  home.classList.toggle("home--visible");
});
