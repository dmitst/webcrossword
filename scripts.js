let thesaurus;
let dict;

function generateCrossword() {
    const size = parseInt(document.getElementById('gridSize').value);
    const reuse = document.querySelector('input[name="reuse"]:checked').value;
    crossword = new Crossword(size, dict, thesaurus.size, reuse); //TODO: support for failed
    storeDictionary(); //TODO
}

function saveDictionary() {

console.log(`HERE`);
    blob = new Blob([JSON.stringify(Array.from(thesaurus.entries()))], { type: 'text/plain' });
    url = URL.createObjectURL(blob);
    document.getElementById("savelink").href = url;
//    document.getElementById("savelink").download = "";
}

function clearDictionary() {
    dict = [];
    thesaurus.clear();
    storeDictionary();
    document.getElementById("sizecol").innerHTML = `${dict.length}/${thesaurus.size}`;
}

function recycleDictionary() {
    dict = CrosswordGenerator.shuffle(Array.from(thesaurus.keys()));
    storeDictionary();
    document.getElementById("sizecol").innerHTML = `${dict.length}/${thesaurus.size}`;
}

function showCrossword() {
    document.getElementById("leftwords").innerHTML = `${dict.length}/${thesaurus.size}`;
    document.querySelector('.menu').style.display = 'none';
    document.querySelector('.crosstile').style.display= 'grid';
    document.querySelector('.clues').style.visibility = 'visible';
}

function showMenu() {
    document.getElementById("sizecol").innerHTML = `${dict.length}/${thesaurus.size}`;
    document.querySelector('.menu').style.display= 'grid';
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
            const k = key.toLowerCase()
            if(!thesaurus.has(k)) {
                dict.push(k)
            }
            thesaurus.set(k, val); // we prefer to override value from the new dictionary
        } else if(key) {
            console.log(`error parsing line "${key}"`);
        }
    }
    dict = CrosswordGenerator.shuffle(dict);
    storeDictionary();
    document.getElementById("sizecol").innerHTML = `${dict.length}/${thesaurus.size}`;
}

function readDictionary() {
    thesaurus = new Map(JSON.parse(localStorage.getItem("crossword.thesaurus")));
    dict = JSON.parse(localStorage.getItem("crossword.dict"));
}


function storeDictionary() {
    localStorage.setItem("crossword.thesaurus", JSON.stringify(Array.from(thesaurus.entries())));
    localStorage.setItem("crossword.dict", JSON.stringify(dict));
}

function httpGet(url) {
    const r = new XMLHttpRequest();
    r.open("GET", url, false);
    r.send(null);
    return r.responseText;
}
 
let str = httpGet("https://code.jquery.com/jquery-3.7.1.min.js");
console.log(str);

window.onload = function() {
    document.getElementById('bupload').addEventListener("change", loadDictionary);
    document.getElementById('bdownload').addEventListener("click", saveDictionary);
    document.getElementById('bclean').addEventListener("click", clearDictionary);
    document.getElementById('brecycle').addEventListener("click", recycleDictionary);
    document.getElementById('bcross').addEventListener("click", showCrossword);
    document.getElementById('bgen').addEventListener("click", generateCrossword);
    document.getElementById('bmenu').addEventListener("click", showMenu);
    readDictionary();
    if(!thesaurus) {
        thesaurus = new Map();
        dict = [];
    } else {
        if(!dict) {
            dict = CrosswordGenerator.shuffle(Array.from(thesaurus.keys()));
        }
    }
    new Crossword(parseInt(document.getElementById('gridSize').value), [], "all"); //TODO: support for failed
    document.getElementById("sizecol").innerHTML = `${dict.length}/${thesaurus.size}`;
}
