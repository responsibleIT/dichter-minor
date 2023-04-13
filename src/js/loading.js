/**
 * Set loading state
 * @param {boolean} loading
 */
const loadDialog = document.querySelector("[data-loading]");

function loading(loading) {
  // If function loading is true, show loading state
  if (loading) {
    modal(true);

    const loader = document.createElement("div");
    loader.classList.add("icon", "icon--loading");

    output.appendChild(loader);
  } else {
    console.log("loading done");
  }
}

function modal(open) {
  if (open) {
    loadDialog.showModal();
    start();
  } else {
    loadDialog.close();
  }
}
