class Crossword {
    constructor(size, dict, thesaurus, reuse) {        
        this.size = size;
        this.dict = dict;
        this.thesaurus = thesaurus;
        this.reuse = reuse;
        this.currentPosition = -1;
        this.currentHorizontal = true;
        this.lettersToGo = 0;
        this.clues = new Map(); // clueId : word
        this.clues = new Map(); // clueId : word
        this.boxes = [];
        this.generateGrid();
        const words = CrosswordGenerator.generateCrossword(size, dict);
        this.generateClues(words);
        // push the used words back to the end of the dictionary
        if(reuse != 'none') {
            this.dictFrom = dict.length;
            for (let i = 0; i != words.length; ++i) {
                dict.push(words[i].text);
            }
        }

        document.getElementById("leftwords").innerHTML = `${dict.length} words left`;
        document.getElementById("backclue").onclick = () => this.switchClues(false);
        Crossword.addToolbarKeys(this);
        Crossword.createKeyboardPopup(this);
        Crossword.setKeyHandler(this);
    }

    static setKeyHandler(crossword) {
        document.body.onkeydown = function(event) {
            crossword.processKeyPress(event);
            return false;
        };
    }

    static addToolbarKeys(crossword) {
        Crossword.addClueIdx('hint', 0).onclick = function () {
            crossword.writeLetterAndAdvancePos('', true);
            return false;
        };
        Crossword.addClueIdx('solve', '=').onclick = function () {
            crossword.solveCrossword();
            return false;
        };
        Crossword.addClueIdx('kbd', '').onclick = function () {
            crossword.showKeyboardPopup();
            return false;
        };
        Crossword.addClueIdx('b1', 1).onclick = function () {
            crossword.writeLetterAndAdvancePos('è', false);
            return false;
        };
        Crossword.addClueIdx('b2', 2).onclick = function () {
            crossword.writeLetterAndAdvancePos('ö', false);
            return false;
        };
        Crossword.addClueIdx('b3', 3).onclick = function () {
            crossword.writeLetterAndAdvancePos('ß', false);
            return false;
        };
        Crossword.addClueIdx('b4', 4).onclick = function () {
            crossword.writeLetterAndAdvancePos('ä', false);
            return false;
        };
        Crossword.addClueIdx('b5', 5).onclick = function () {
            crossword.writeLetterAndAdvancePos('ü', false);
            return false;
        };
    }

    generateGrid() {
        const grid = document.querySelector('.crossword');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.size}, max-content)`;
        grid.style.gridTemplateRows = 'auto';//`repeat(${this.size}, max-content)`;
                                             //grid.style.height = `${this.size * 40}px`;

        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.id = i;
            cell.appendChild(document.createTextNode(' '));
            cell.className = 'cell blank';
            grid.appendChild(cell);

            this.boxes.push({ isBlank: true, isGuessed: false, isSelected: false, isHinted: false, isFocused: false, value: ' ', answer: ' ', horizontalWord: undefined, verticalWord: undefined, });
        }
    }

    generateClues(words) {
        document.getElementById('horclues').innerHTML = '';
        document.getElementById('verclues').innerHTML = '';

        for (let i = 0; i != words.length; i++) {
            Crossword.addClue(words[i]);
            Crossword.addClueIdx(words[i].position, words[i].index);
            this.fillBox(words[i]);
        }
        if(words.length) {
            this.focusAndSelect(words[0].position, words[0].isHorizontal);
            Crossword.fillCurrentClue(words[0]);
        }
    }

    switchClues(on) {
        const cross = document.querySelector('.crosstile');
        const clues = document.querySelector('.clues');
        if(window.getComputedStyle(cross, null).display == 'none'
                || window.getComputedStyle(clues, null).display == 'none') {
            if(on) {
                cross.style.display = 'none';
                clues.style.display = 'block';
                clues.style.width = "100%";
                clues.style.visibility = 'visible';
            } else {
                clues.style.display = 'none';
                cross.style.display = 'block';
                cross.style.visibility = 'visible';
            }
        }
    }

    static addClue(word) {
        const li = document.createElement('li');
        li.id = Crossword.makeClueId(word);
        const desc = thesaurus.get(word.text);
        li.innerHTML=`${word.index}. ${desc}`;
        li.onclick = function () {
            crossword.focusAndSelect(word.position, word.isHorizontal);
            Crossword.fillCurrentClue(word);
            crossword.switchClues(false);
            return false;
        };
        if(word.isHorizontal) {
            document.getElementById('horclues').appendChild(li);
        } else {
            document.getElementById('verclues').appendChild(li);
        }
    }

    static fillCurrentClue(word) {
        const desc = thesaurus.get(word.text);
        const c = word.isHorizontal ? '→' : '↓';
        document.getElementById('currentClue').innerText = `  ${word.index}${c} ${desc}`;
    }

    static addClueIdx(pos, idx) {
        const cell = document.getElementById(pos);
        if(cell) {
            const index = document.createElement('span');
            index.className = 'index';
            index.textContent = idx;
            cell.appendChild(index);
        }
        return cell;
    }

    fillBox(word) {
        const crossword = this;
        for(let i = 0; i != word.text.length; ++i) {
            const pos = this.advance(word.position, i, word.isHorizontal);
            const box = this.boxes[pos];
            if(box.isBlank) {
                ++this.lettersToGo;
                //document.getElementById('lettersToGo').innerText = this.lettersToGo;
            }
            box.isBlank = false;
            box.answer = word.text[i];
            if(word.isHorizontal) {
                box.horizontalWord = word;
            } else {
                box.verticalWord = word;
            }

            const cell = document.getElementById(pos);
            if(cell) {
                cell.onclick = function () {
                    crossword.focusAndSelect(pos);
                    return false;
                };
                this.drawBox(pos);
            }
        }
    }

    advance(pos, steps, directionHorizontal) {
        const delta = (directionHorizontal ? 1 : this.size);
        const minpos = directionHorizontal ? (pos - pos % this.size - 1) : -1;
        const maxpos = directionHorizontal ? (pos - pos % this.size + this.size) : (this.size * this.size);
        const newpos = pos + delta * steps;
        return newpos > minpos && newpos < maxpos ? newpos : -1;
    }

    static makeClueId(word) {
        return word.isHorizontal ? `clue${word.position}H` : `clue${word.position}V`
    }

    focusAndSelect(pos, hor) {
        const box = this.boxes[pos];
        if (box == undefined) {
            console.log(`No box at pos ${pos}`);//FIXME
        } else if(!box.isBlank) {
            const hadFocus = this.currentPosition == pos;
            this.focus(false);
            this.selectWord(false);
            this.currentPosition = pos;
            if(hadFocus) {
                this.currentHorizontal = !this.currentHorizontal;
            }
            if(hor != undefined) {
                this.currentHorizontal = hor;
            }
            this.selectWord(true);
            this.focus(true);
            this.moveKeyboardPopup();
        }
    }

    processCursorKey(code) {
        switch(code) {
            case 'Enter':
                this.focusAndSelect(this.currentPosition);
                break;
            case 'ArrowDown':
                this.focusAndSelect(this.currentPosition + this.size);
                break;
            case 'ArrowUp':
                this.focusAndSelect(this.currentPosition - this.size);
                break;
            case 'ArrowLeft':
                if(this.currentPosition % this.size != 0) {
                    this.focusAndSelect(this.currentPosition - 1);
                }
                break;
            case 'ArrowRight':
                const nextPos = this.currentPosition + 1;
                if(nextPos % this.size != 0) {
                    this.focusAndSelect(nextPos);
                }
                break;
            case 'Backspace':
                this.backspace();
                break;
        }
    }

    writeLetterAndAdvancePos(ch, isHint) {
        const box = this.boxes[this.currentPosition];
        if(!box.isGuessed && !box.isHinted) {
            if(isHint) {
                box.value = box.answer;
                box.isHinted = true;
                this.reduceGuessed();
            } else {
                box.value = ch;
            }
            this.drawBox(this.currentPosition);
            if(box.horizontalWord) {
                this.checkAndMarkGuessedWord(box.horizontalWord);
            }
            if(box.verticalWord) {
                this.checkAndMarkGuessedWord(box.verticalWord);
            }
        }
        this.advancePos(1);
    }

    backspace() {
        const box = this.boxes[this.currentPosition];
        if(!box.isGuessed && !box.isHinted) {
            box.value = ' ';
            this.drawBox(this.currentPosition);
        }
        this.advancePos(-1);
    }

    checkAndMarkGuessedWord(word) {
        for(let i = 0; i != word.text.length; ++i) {
            const pos = this.advance(word.position, i, word.isHorizontal);
            const box = this.boxes[pos];
            if(box.value != box.answer) {
                return;
            }
        }

        let hinted = false; 
        for(let i = 0; i != word.text.length; ++i) {
            const pos = this.advance(word.position, i, word.isHorizontal);
            const box = this.boxes[pos];
            if(!box.isGuessed && !box.isHinted) {
                this.reduceGuessed();
            }
            hinted = hinted || box.isHinted;
            box.isGuessed = !box.isHinted;
            this.drawBox(pos);
        }
        // remove word from dict if it's not failed
        if(!hinted && this.reuse == 'failed') {
            console.log(`removing guessed word ${word.text}`);
            for (let i = this.dictFrom; i != dict.length; ++i) {
                if(dict[i] == word.text) {
                    dict[i] = dict[dict.length - 1];
                    dict.pop();
                    console.log(`removed from pos ${i}`);
                    break;
                }
            }
        }
    }

    reduceGuessed() {
        --this.lettersToGo;
        //document.getElementById('lettersToGo').innerText = this.lettersToGo;
    }

    advancePos(delta) {
        let pos = this.currentPosition;
        let box;
        do {
            pos = this.advance(pos, delta, this.currentHorizontal);
            box = this.boxes[pos];
        } while(pos != -1 && !box.isBlank && (box.isGuessed || box.isHinted));
        if(pos != -1 && !box.isBlank) {
            this.focusAndSelect(pos);
        }
    }

    solveCrossword() {
        for(let i = 0; i != this.boxes.length; ++i) {
            const box = this.boxes[i];
            if(!box.isBlank && !box.isGuessed && !box.isHinted) {
                box.isHinted = true;
                box.value = box.answer;
                this.drawBox(i);
            }
        }
    }

    processSpecialKey(ch) {
        switch(ch) {
            case '0':
                this.writeLetterAndAdvancePos(ch, true);
                break;
            case '5':
                this.writeLetterAndAdvancePos('ü', false);
                break;
            case '4':
                this.writeLetterAndAdvancePos('ä', false);
                break;
            case '3':
                this.writeLetterAndAdvancePos('ß', false);
                break;
            case '2':
                this.writeLetterAndAdvancePos('ö', false);
                break;
            case '1':
                this.writeLetterAndAdvancePos('è', false);
                break;
        }
    }

    processKeyPress(event) {
        const ch = event.key.toLowerCase();
        if (!event.ctrlKey && !event.metaKey) {
            if(ch.length == 1) {
                if(ch >='a' && ch <= 'z') {
                    this.writeLetterAndAdvancePos(ch, false);
                } else if(ch >='0' && ch <= '5') {
                    this.processSpecialKey(ch);
                } else if(ch == '=') {
                    this.solveCrossword();
                }
            } else {
                this.processCursorKey(event.code)
            }
        }
    }

    focus(turnOn) {
        if(this.currentPosition != -1) {
            const box = this.boxes[this.currentPosition];
            box.isFocused = turnOn;
            this.drawBox(this.currentPosition);
        }
    }

    selectWord(turnOn) {
        if(this.currentPosition != -1) {
            const word = this.getWord();
            if(word) {
                for(let i = 0; i != word.text.length; ++i) {
                    const pos = this.advance(word.position, i, word.isHorizontal);
                    const box = this.boxes[pos];
                    box.isSelected = turnOn;
                    this.drawBox(pos);
                }
                this.drawActiveClue(Crossword.makeClueId(word), turnOn);
                if(turnOn) {
                    Crossword.fillCurrentClue(word);
                } //TODO: should we clean it in else{} ?
            }
        }
    }

    getWord() {
        if(this.currentPosition != -1) {
            const box = this.boxes[this.currentPosition];
            const word = this.currentHorizontal ? (box.horizontalWord ? box.horizontalWord : box.verticalWord) :
                (box.verticalWord ? box.verticalWord : box.horizontalWord);
            if(word) {
                this.currentHorizontal = word.isHorizontal;
            }
            return word;
        }
    }

    drawBox(pos) {
        const box = this.boxes[pos];
        const cell = document.getElementById(pos);
        if(cell) {
            const focus = box.isFocused ? 'focused' : '';
            if(box.isBlank) {
                cell.className = 'cell blank';
            } else if(box.isGuessed) {
                cell.className = `cell guessed${focus}`;
            } else if(box.isHinted) {
                cell.className = `cell hinted${focus}`;
            } else if(box.isSelected) {
                cell.className = `cell selected${focus}`;
            } else {
                cell.className = 'cell';
            }
            Crossword.setCellValue(cell, box.value);
        }
    }

    drawActiveClue(clueId, turnOn) {
        const clue = document.getElementById(clueId);
        clue.className = turnOn ? 'selected' : '';
    }

    static getTextNode(node) {
        const children = node.childNodes;
        for (let i = 0; i != children.length; i++) {
            let item = children[i];
            if(item.nodeType == 3) {
                return item;
            }
        }
        return undefined;
    }

    static setCellValue(cell, ch) {
        return Crossword.getTextNode(cell).textContent = ch;
    }

    static createKeyboardPopup(crossword) {
        let existingPopup = document.querySelector('.keyboard-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'keyboard-popup';

        const layout = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
            [ 'è', 'ö', 'ü', 'ä', 'ß']
        ];

        layout.forEach(row => {
           const rowDiv = document.createElement('div');
           rowDiv.className = 'row';

           row.forEach(key => {
               const button = document.createElement('button');
               button.textContent = key;
               button.onclick = () => crossword.writeLetterAndAdvancePos(key, false);
               rowDiv.appendChild(button);
           });

           popup.appendChild(rowDiv);
          });

          const lastRow = document.createElement('div');
          lastRow.className = 'row';

          const buttonMenu = document.createElement('button');
          buttonMenu.textContent = '⋮';//≡
          buttonMenu.onclick = () => showMenu();
          lastRow.appendChild(buttonMenu);

          const buttonNew = document.createElement('button');
          buttonNew.textContent = '⟲';// ▦⊞
          buttonNew.onclick = () => generateCrossword();
          lastRow.appendChild(buttonNew);

          const buttonClue = document.createElement('button');
          buttonClue.textContent = '…';
          buttonClue.onclick = () => crossword.switchClues(true);
          lastRow.appendChild(buttonClue);

          const buttonHint = document.createElement('button');
          buttonHint.textContent = '?';
          buttonHint.onclick = () => crossword.writeLetterAndAdvancePos('', true);
          lastRow.appendChild(buttonHint);

          const buttonSolve = document.createElement('button');
          buttonSolve.textContent = '✓';
          buttonSolve.onclick = () => crossword.solveCrossword();
          lastRow.appendChild(buttonSolve);

          const buttonBS = document.createElement('button');
          buttonBS.textContent = '←';
          buttonBS.onclick = () => crossword.backspace();
          lastRow.appendChild(buttonBS);

          popup.appendChild(lastRow);
          let el = document.querySelector('.crosstile');
          el.appendChild(popup);
          //Ξ
    }

    showKeyboardPopup() {
        let popup = document.querySelector('.keyboard-popup');
        if (popup) {
            popup.style.display = popup.style.display == "block" ? "none" : "block";
            this.moveKeyboardPopup();
        }
    }

    moveKeyboardPopup() {
        const pad = 5;
        const popup = document.querySelector('.keyboard-popup');
        if(!popup || popup.style.display != 'block' || this.currentPosition == -1) {
            return;
        }
        const popupRect = popup.getBoundingClientRect();
        const grid = document.querySelector('.crossword');
        const gridRect = grid.getBoundingClientRect();
        const cur = document.getElementById(this.currentPosition);
        const curRect = cur.getBoundingClientRect();

        let x,y;
        if(this.currentHorizontal) {
            // the keyboard should be below or above pos
            x = ~~((gridRect.width - popupRect.width) / 2) + gridRect.left;
            if(curRect.top - gridRect.top > popupRect.height + pad) {
                y = curRect.top - popupRect.height - pad;
            } else {
                y = curRect.bottom + pad;
            }
        } else {
            // the keyboard should be to the right (left) from pos
            y = ~~((gridRect.height - popupRect.height) / 2) + gridRect.top;
            if(curRect.left - gridRect.left > popupRect.width + pad) {
                x = curRect.left - popupRect.width - pad;
            } else {
                x = curRect.right + pad;
            }
        }

        popup.style.top = `${y}px`;
        popup.style.left = `${x}px`;
    }

    buttonPressed(key) {
        console.log(`Key pressed: ${key}`);
    }
}
