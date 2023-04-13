// Galgje

const alphabet = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
];

const testWords = [
	'motor',
	'appel',
	'wonen',
	'school',
	'kamer',
	'chips',
	'hoofd',
	'kunst',
  'dom',
  'wetenschapper',
	'kunstenaar',
	'ortopeed',
	'vrijheid',
	'typografie',
	'melodie',
	'astronaut',
	'psycholoog',
	'appelflap',
	'zomer',
  'nederland',
  'tecghnologie',
  'ai',
  'kalkoen',
  'bosaap',
  'rekenmachine',
  'framework',
  'framboos',
	'winter',
	'lente',
	'kippen',
	'gedicht',
	'lopen',
	'amsterdam',
	'aardappel',
	'fernandes',
	'maaltijd',
	'koffie',
	'erbij',
  'eend',
  'koptelefoon',
  'android',
  'fronntend',
  'backend',
	'energy',
];

const completeMessage = [
	'Het is je gelukt! Op naar het volgende woord!',
	'Je hebt het woord geraden! Ga zo door!',
	'Leuk gedaan! Je hebt het woord geraden!',
	'lekker bezig! Je bent een topper!',
	'Natuurtalent! Niet te geloven!',
	'Je bent een winnaar!',
	'Heerlijk! weer een woord in de pocket!',
];

const loadingText = [
	'Laden...',
	'AI is even een kopje thee aan het drinken...',
	'Nog eventjes geduld...',
	'Lekker weer vandaag he...?',
	'Speel maar nog even verder',
	'AI neemt wel zijn tijd zeg...',
  'A few moments later...',
  'And still loading...',
  'Nog even volhouden...',
];

const options = document.querySelector('[data-options]');
const word = document.querySelector('[data-word]');
let randomWord;

function createWord() {
	resetChildren(word);
	const rIndex = Math.floor(Math.random() * testWords.length);
	randomWord = testWords[rIndex];
	const letterArray = Array.from(randomWord);

	letterArray.forEach((letter) => {
		const span = document.createElement('span');
		span.classList.add('letter');
		word.appendChild(span);
	});
}

function createKeyboard() {
	resetChildren(options);

	alphabet.forEach((item, i, all) => {
		const child = document.createElement('button');
		child.classList.add('alphabet');
		child.textContent = item;
		child.value = item;

		child.addEventListener('click', (e) => {
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
	const letters = Array.from(document.querySelectorAll('.letter'));
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
	checkIfComplete();
}

function checkIfComplete() {
	const letters = Array.from(document.querySelectorAll('.letter'));

	const state = letters
		.map((letter) => !letter.textContent)
		.filter((item) => item);
	// word complete
	if (state.length == 0) {
		// complete state
		const popup = document.querySelector('[data-popup]');
		const randomIndex = Math.floor(Math.random() * completeMessage.length);

		popup.classList.add('popup--visible');
		popup.textContent = completeMessage[randomIndex];
		setTimeout(function () {
			popup.classList.remove('popup--visible');
		}, 2800);
	}
}

function start() {
	createWord();
	createKeyboard();
}

let counter = 0;
const inst = setInterval(changeLoadText, 20000);

function changeLoadText() {
	const elem = document.querySelector('.loading span');
	elem.textContent = loadingText[counter];
	counter++;
	if (counter >= loadingText.length) {
		counter = 0;
		// clearInterval(inst);
	}
}
const nextBtn = document.querySelector('[data-next-word]');

nextBtn.addEventListener('click', (e) => {
	e.preventDefault();
	start();
});
