// import "./components";

// import loading from "./loading.js";

const submit = document.querySelector("[data-submit]");
const types = document.querySelectorAll(".control--type input");
const theme = document.querySelector("[name='theme']");

const output = document.querySelector("[data-outlet]");

const main = document.querySelector("main");
const aside = document.querySelector("aside");

let paragraphString;

theme.addEventListener("input", (e) => {
  if (e.target.value !== "") {
    submit.classList.add("cta--visible");
    submit.classList.remove("cta--hidden");
  } else {
    submit.classList.remove("cta--visible");
    submit.classList.add("cta--hidden");
  }
});

if (submit) {
  console.log(submit);

  const displayPoetry = (data) => {
    loading(false);
    aside.innerHTML = "";
    paragraphString = "";

    console.log("displayPoetry", data);
    const { paragraph, keywords } = data;

    const cutParagraph = paragraph.split(" ");
    cutParagraph.forEach((word) => {
      const keyword = keywords.find((keyword) => keyword.keyword === word);
      if (keyword) {
        paragraphString += `
                <span class="keyword" data-alternatives="${keyword.alternatives.join(
                  ","
                )}">${word}</span>
                `;
      } else {
        paragraphString += `${word} `;
      }
    });
    output.innerHTML = paragraphString.trim();

    const spans = output.querySelectorAll("span");
    spans.forEach((span) => {
      span.addEventListener("click", showWordAlternatives);
    });
  };

  const replaceWord = async (e) => {
    loading(true);
    const item = e.target;
    const oldWord = item.dataset.oldWord;
    const newWord = item.textContent;

    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldWord,
        newWord,
        paragraph: output.textContent,
      }),
    });

    const { data } = await response.json();
    displayPoetry(data);
  };

  const showWordAlternatives = (e) => {
    aside.innerHTML = "";

    const { alternatives } = e.target.dataset;
    const alternativesArray = alternatives.split(",");

    // create element
    const ul = document.createElement("ul");
    alternativesArray.forEach((alternative) => {
      const li = document.createElement("li");
      li.textContent = alternative;
      li.dataset.oldWord = e.target.textContent.trim();
      ul.appendChild(li);
    });

    aside.innerHTML = ul.outerHTML;
    main.appendChild(aside);

    const replacements = document.querySelectorAll("aside ul li");
    replacements.forEach((replacement) => {
      replacement.addEventListener("click", replaceWord);
    });
  };

  const fetchPoetry = async () => {
    loading(true);
    const activeType = Array.from(types).find((type) => type.checked);
    const response = await fetch("/api/poetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: activeType.value,
        theme: theme.value,
      }),
    });

    console.log(response);

    const { data } = await response.json();
    console.log("fetchPoetry", data);
    displayPoetry(data);
  };

  submit.addEventListener("click", fetchPoetry);
}

const home = document.querySelector("[data-home]");
const homeBtn = document.querySelector("[data-home-btn]");

homeBtn.addEventListener("click", () => {
  home.classList.toggle("home--visible");
});
