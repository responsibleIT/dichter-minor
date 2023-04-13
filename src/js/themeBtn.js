theme.addEventListener("input", (e) => {
  if (e.target.value !== "") {
    submit.classList.add("cta--visible");
    submit.classList.remove("cta--hidden");
  } else {
    submit.classList.remove("cta--visible");
    submit.classList.add("cta--hidden");
  }
});
