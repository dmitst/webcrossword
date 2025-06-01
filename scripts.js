let flashcards;
let deck;
let thesaurus;
let dict;

function generateCrossword() {
    const size = parseInt(document.getElementById('gridSize').value);
    const reuse = document.querySelector('input[name="reuse"]:checked').value;
    crossword = new Crossword(size, dict, thesaurus.size, reuse); //TODO: support for failed
    storeDictionary(); //TODO
}

function serialize(map) {
    let r = "";
    map.forEach ((value, key) => r += (r ? '\n' : '') + `${key}:${value}`);
    return r;
}

function saveDictionary() {
    blob = new Blob([serialize(isGameFlashcards() ? flashcards : thesaurus)], { type: 'text/plain' })  
    document.getElementById("savelink").href = URL.createObjectURL(blob);
    document.getElementById("savelink").download = isGameFlashcards() ? "flashcards.txt" : "crossword.txt";
}

function clearDictionary() {
    if(isGameFlashcards()) {
        deck = [];
        flashcards.clear();
    } else {
        dict = [];
        thesaurus.clear();
    }
    storeDictionary();
    showSize();
}

function recycleDictionary() {
    if(isGameFlashcards()) {
        deck = CrosswordGenerator.shuffle(Array.from(flashcards, ([face, back]) => ([face, back, false])));
    } else {
        dict = CrosswordGenerator.shuffle(Array.from(thesaurus.keys()));
    }
    storeDictionary();
    showSize();
}

function showCrossword() {
    document.getElementById("leftwords").innerHTML = `${dict.length}/${thesaurus.size}`;
    document.querySelector('.menu').style.display = 'none';
    document.querySelector('.cardstile').style.display= 'none';
    document.querySelector('.crosstile').style.display= 'grid';
    document.querySelector('.clues').style.visibility = 'visible';
}

function showCards() {
    showCard();
    document.querySelector('.menu').style.display = 'none';
    document.querySelector('.cardstile').style.display= 'grid';
    document.querySelector('.crosstile').style.display= 'none';
    document.querySelector('.clues').style.visibility = 'hidden';
}

function isGameFlashcards() {
    return ("cards" == document.querySelector('input[name="games"]:checked').value); 
}

function showSize() {
    document.getElementById("sizecol").innerHTML = isGameFlashcards() ? `${deck.length}/${flashcards.size}` : `${dict.length}/${thesaurus.size}`;
}

function showMenu() {
    showSize();
    document.querySelector('.menu').style.display= 'grid';
    document.querySelector('.cardstile').style.display= 'none';
    document.querySelector('.crosstile').style.display= 'none';
    document.querySelector('.clues').style.visibility = 'hidden';
}

function loadDictionary(e) {
    fileName = e.target.files[0];
    if (fileName) {
        const fr = new FileReader();
        fr.onload = function () {
            parseDictionary(fr.result);
        }
        fr.readAsText(fileName);
    }
}

function parseDictionary(text) {
    const lines = text.split(/\r\n|\n/);
    for (let i = 0; i != lines.length; i++) {
        const line = lines[i].split(/\s*:\s*/, 2);
        const key = line[0].trim();
        if(key.startsWith('#')) {
            console.log(`comment: "${lines[i]}"`);
        } else if(line.length == 2) {
            const val = line[1].trim();
            if(isGameFlashcards()) {
                addFlashcard(key, val);
            } else {
                addThesaurus(key, val);
            }
        } else if(key) {
            console.log(`error parsing line "${key}"`);
        }
    }
    dict = CrosswordGenerator.shuffle(dict);
    deck = CrosswordGenerator.shuffle(deck);
    storeDictionary();
    showSize();
}

function addFlashcard(key, val) {
    if(key.startsWith('@')) {
        key = key.substring(1);
    }
    if(!flashcards.has(key)) {
        deck.push([key, val, false]);
    }
    flashcards.set(key, val); // we prefer to override value from the new dictionary
}

const pattern = /(?:der |die |das )?\s*([^/]*)/;
function addThesaurus(key, val) {
//  flashcards format is [der|die|das] noun/plural : value
    if(key.startsWith('@')) {
        console.log(`skipping expression <${key}>`);
    } else {
        const k = key.toLowerCase().match(pattern);
        if(!thesaurus.has(k)) {
            dict.push(k)
        }
        thesaurus.set(k, val); // we prefer to override value from the new dictionary
    }
}

function readDictionary() {
    flashcards = new Map(JSON.parse(localStorage.getItem("flashcards.thesaurus")));
    thesaurus = new Map(JSON.parse(localStorage.getItem("crossword.thesaurus")));
    deck = JSON.parse(localStorage.getItem("flashcards.deck"));
    dict = JSON.parse(localStorage.getItem("crossword.dict"));
    if(!thesaurus) {
        thesaurus = new Map();
        dict = [];
    } 
    if(!dict) {
        dict = CrosswordGenerator.shuffle(Array.from(thesaurus.keys()));
    }
    if(!deck) {
        deck = CrosswordGenerator.shuffle(Array.from(flashcards, ([face, back]) => ([face, back, false])));
    }
}

function storeDictionary() {
    localStorage.setItem("flashcards.thesaurus", JSON.stringify(Array.from(flashcards.entries())));
    localStorage.setItem("flashcards.deck", JSON.stringify(deck));
    localStorage.setItem("crossword.thesaurus", JSON.stringify(Array.from(thesaurus.entries())));
    localStorage.setItem("crossword.dict", JSON.stringify(dict));
}

function httpGet(url) {
    const r = new XMLHttpRequest();
    r.open("GET", url, false);
    r.send(null);
    return r.responseText;
}
 
function loadSuppliedDictionary() {
    d = document.getElementById("selectdict").value;
    let str = httpGet(`https://dmitst.github.io/webcrossword/${d}`);
    parseDictionary(str);
}

function switchGame() {
    showSize();
    const b = isGameFlashcards();
    const s1 =  b ? '.cardsonly' : '.crossonly';
    const s2 =  b ? '.crossonly' : '.cardsonly';
    document.querySelectorAll(s1).forEach((r) => r.style.display = 'block');
    document.querySelectorAll(s2).forEach((r) => r.style.display = 'none');
}

function setEasy() {
    if(deck) {
        deck[0][2] = true;
        nextCard(true);
    }
}

function setHard() {
    if(deck) {
        deck[0][2] = false;
        nextCard(true);
    }
}

function forget() {
    nextCard(false);
}

function nextCard(cycle) {
    let card = deck.shift();
    if(cycle) {
        deck.push(card);
    }
    showCard();
}

function reverse() {
    const face = document.getElementById("cardface");
    const back = document.getElementById("cardback");
    face.style.display= face.style.display == 'none' ? 'block':'none';
    back.style.display= back.style.display == 'none' ? 'block':'none';
}

function showCard(reverse) {
    document.getElementById("cardnum").innerHTML = `cards ${deck.length}/${flashcards.size}`; 
    if(deck) {
        const isFace = "face" == document.querySelector('input[name="cardside"]:checked').value; 
        const face = document.getElementById("cardface");
        const back = document.getElementById("cardback");
        face.innerHTML = deck[0][0];
        back.innerHTML = deck[0][1];
        face.style.display= isFace ? 'block':'none';
        back.style.display= isFace ? 'none':'block';
    }
}

window.onload = function() {
    document.getElementById('selectdict').addEventListener("change", loadSuppliedDictionary);
    document.getElementById('bupload').addEventListener("change", loadDictionary);
    document.getElementById('bdownload').addEventListener("click", saveDictionary);
    document.getElementById('bclean').addEventListener("click", clearDictionary);
    document.getElementById('brecycle').addEventListener("click", recycleDictionary);
    document.getElementById('bcross').addEventListener("click", showCrossword);
    document.getElementById('bcards').addEventListener("click", showCards);
    document.getElementById('bgen').addEventListener("click", generateCrossword);
    document.getElementById('bmenu').addEventListener("click", showMenu);
    document.getElementById('bmenu2').addEventListener("click", showMenu);
    document.getElementById('easy').addEventListener("click", setEasy);
    document.getElementById('hard').addEventListener("click", setHard);
    document.getElementById('forget').addEventListener("click", forget);
    document.getElementById('reverse').addEventListener("click", reverse);

    document.getElementsByName("games").forEach((r) => r.addEventListener("change", switchGame))
    readDictionary();
    new Crossword(parseInt(document.getElementById('gridSize').value), [], "all"); //TODO: support for failed
    switchGame();
}
