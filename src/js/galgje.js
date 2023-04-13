// Galgje

const alphabet = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

const testWords = [
  "mijn",
  "appel",
  "wonen",
  "kippen",
  "gedicht",
  "lopen",
  "cmd",
  "amsterdam",
  "aardappel",
  "fernandes",
  "houd",
  "je",
  "koffie",
  "erbij",
  "energy",
];

const options = document.querySelector("[data-options]");
const word = document.querySelector("[data-word]");
const randomIndex = Math.floor(Math.random() * testWords.length);
let randomWord;

function createWord() {
  resetChildren(word);
  const rIndex = Math.floor(Math.random() * testWords.length);
  randomWord = testWords[rIndex];
  const letterArray = Array.from(randomWord);

  letterArray.forEach((letter) => {
    const span = document.createElement("span");
    span.classList.add("letter");
    word.appendChild(span);
  });
}

function createKeyboard() {
  resetChildren(options);

  alphabet.forEach((item, i, all) => {
    const child = document.createElement("button");
    child.classList.add("alphabet__control");
    child.textContent = item;
    child.value = item;

    child.addEventListener("click", (e) => {
      e.preventDefault();
      checkLetterAndUpdate(e.target.value);

      if (child.value == e.target.value) {
        child.disabled = true;
      }

      checkIfComplete();
    });

    options.appendChild(child);

    // if (i == all.length - 1) {
    //   start();
    // }
  });
}

function resetChildren(element) {
  if (element.children) {
    Array.from(element.children).forEach((child) => {
      child.remove();
    });
  }
}

// Game setup

function checkLetterAndUpdate(letter) {
  const letters = Array.from(document.querySelectorAll(".letter"));
  const buttons = document.querySelectorAll(".alphabet__control");
  const check = Array.from(randomWord)
    .map((option) => option == letter)
    .find((item) => item);
  if (check) {
    Array.from(randomWord).forEach((item, i) => {
      if (item == letter) {
        letters[i].textContent = letter;
      }
    });
  }
}

function checkIfComplete() {
  const letters = Array.from(document.querySelectorAll(".letter"));

  const state = letters
    .map((letter) => !letter.textContent)
    .filter((item) => item);
  // word complete
  if (state.length == 0) {
    // complete state
    // Next wordt oid.
  }
}

function start() {
  createWord();
  createKeyboard();
}

const nextBtn = document.querySelector("[data-next-word]");

nextBtn.addEventListener("click", (e) => {
  e.preventDefault();
  start();
});
