const HARD_SKIP = 20;
let flashcards = new Map();
let deck = [];
let thesaurus = new Map();
let dict = [];
let game;

function generateCrossword() {
    const size = parseInt(document.getElementById('gridSize').value);
    const reuse = document.querySelector('input[name="reuse"]:checked').value;
    crossword = new Crossword(size, dict, thesaurus, reuse); 
    storeDictionary(); 
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

function copyDeck() {
    deck = CrosswordGenerator.shuffle(Array.from(flashcards));
}

function copyDict() {
    dict = CrosswordGenerator.shuffle(Array.from(thesaurus.keys()));
}

function recycleDictionary() {
    if(isGameFlashcards()) {
        copyDeck(); 
    } else {
        copyDict();
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
    return ("Flashcards" == game); 
}

function showSize() {
    document.getElementById("sizecol").innerHTML = isGameFlashcards() ? `${deck.length}/${flashcards.size}` 
        : `${dict.length}/${thesaurus.size}`;
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

//Flashcards format is 
//Noun: [der|die|das] noun/plural:translation
//Verb: verb/other forms for stark verbs:translation 
//Expression: @expression:translation
//Comment: #comment
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
    copyDict();
    copyDeck();
    storeDictionary();
    showSize();
}

function addFlashcard(key, val) {
    if(key.startsWith('@')) {
        key = key.substring(1);
    }
    flashcards.set(key, val); // we prefer to override value from the new dictionary
}

const pattern = /(?:der |die |das )?\s*([^\/ ]+)/;
function addThesaurus(key, val) {
    if(key.startsWith('@')) {
        console.log(`skipping expression <${key}>`);
    } else {
        const k = key.toLowerCase().match(pattern);
        if(k) {
            thesaurus.set(k[1], val); // we prefer to override value from the new dictionary
        } else {
            console.log(`skipping broken expression <${key}>`);
        }
    }
}

function readDictionary() {
    flashcards = new Map(JSON.parse(localStorage.getItem("flashcards.thesaurus")));
    thesaurus = new Map(JSON.parse(localStorage.getItem("crossword.thesaurus")));
    deck = JSON.parse(localStorage.getItem("flashcards.deck"));
    dict = JSON.parse(localStorage.getItem("crossword.dict"));
    if(!flashcards) {
        flashcards = new Map();
        deck = [];
    } 
    if(!thesaurus) {
        thesaurus = new Map();
        dict = [];
    } 
    if(!dict) {
        copyDict();
    }
    if(!deck) {
        copyDeck();
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
    document.getElementById("selectdict").value = "";
    let str = httpGet(`https://dmitst.github.io/webcrossword/${d}`);
    parseDictionary(str);
}

function switchGame() {
    game = game == "Crossword" ? "Flashcards" : "Crossword";
    document.getElementById("games").innerHTML = "⇵" + game;
    showSize();
    const b = isGameFlashcards();
    const s1 =  b ? '.cardsonly' : '.crossonly';
    const s2 =  b ? '.crossonly' : '.cardsonly';
    document.querySelectorAll(s1).forEach((r) => r.style.display = 'block');
    document.querySelectorAll(s2).forEach((r) => r.style.display = 'none');
}

function setEasy() {
    if(deck.length) {
        deck.push(deck.shift());
        showCard();
    }
}

function setHard() {
    if(deck.length > HARD_SKIP + 1) {
        let c = deck[HARD_SKIP];
        deck[HARD_SKIP] = deck[0];
        deck[0] = c;
        showCard();
    } else {
        setEasy();
    }
}

function forget() {
    if(deck.length) {
        deck.shift();
        showCard();
    }
}

function reverse() {
    const face = document.getElementById("cardface");
    const back = document.getElementById("cardback");
    face.style.display= face.style.display == 'none' ? 'block':'none';
    back.style.display= back.style.display == 'none' ? 'block':'none';
}

function showCard() {
    document.getElementById("cardnum").innerHTML = `cards ${deck.length}/${flashcards.size}`; 
    if(deck.length) {
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
    document.getElementById('savelink').addEventListener("click", saveDictionary);
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
    document.getElementById("games").addEventListener("click", switchGame);
    readDictionary();
    generateCrossword();
    switchGame();
}
