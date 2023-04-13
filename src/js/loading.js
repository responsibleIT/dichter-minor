/**
 * Set loading state
 * @param {boolean} loading
 */
const loadDialog = document.querySelector("[data-loading]");
const loadDialogClose = document.querySelector("[data-loading-close]");
const loadGalgjeButton = document.querySelector("[data-galgje-close]");

function loading(loading) {
  // If function loading is true, show loading state
  if (loading) {
    modal(true);

    const loader = document.createElement("div");
    loader.classList.add("icon", "icon--loading");
    loadDialogClose.classList.add("galgje__close--hidden");

    output.appendChild(loader);
  } else {
    const loader = document.querySelector(".icon--loading");
    loader.remove();
    loadDialogClose.classList.remove("galgje__close--hidden");
    console.log("loading done");
  }
}

function modal(open) {
  if (open) {
    loadDialog.showModal();
    start();
    loadGalgjeButton.addEventListener("click", galgjeClose);
  } else {
    loadDialog.close();
    loadGalgjeButton.removeEventListener("click", galgjeClose);
  }
}

function galgjeClose() {
  modal(false);
}
