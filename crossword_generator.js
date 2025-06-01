class CrosswordGenerator {
    // main function to create a crossword
    // returns array of words sorted by word index where word is
    //  {
    //      index - sequential number of word for clues
    //      position - position of the word first letter in the crossword
    //      directionHorizontal
    //      text - the word itself
    //  }
    static generateCrossword(size, dict) {
        const generator = new CrosswordGenerator(size, dict);
        return generator.generate();
    }

    constructor(size, dict) {
        this.size = size;
        this.availableCells = [];
        this.cells = [];
        this.dict = dict;
        this.words = [];
        this.emptyCell = CrosswordGenerator.makeCell(-1);
        this.emptyCell.disable();

        for (let i = 0; i < size * size; i++) {
            this.cells.push(CrosswordGenerator.makeCell(i));
        }
    }

    generate() {
        this.processCell(0);
        while (this.availableCells.length) {
            const i = Math.floor(Math.random() * this.availableCells.length);
            const pos = CrosswordGenerator.removeFromArray(this.availableCells, i);
            this.processCell(pos);
        }

        this.sortWords();
        return this.words;
    }

    static makeCell(pos) {
        return {
           value: ' ' ,
           position: pos,
           horizontalAvailable: true,
           verticalAvailable: true,

           isEmpty() {
               return this.value == ' ';
           },

           isAvailable(directionHorizontal) {
               return directionHorizontal && this.horizontalAvailable || !directionHorizontal && this.verticalAvailable;
           },

           disable() {
               this.horizontalAvailable = false;
               this.verticalAvailable = false;
           },

           disableDirection(directionHorizontal) {
               if (directionHorizontal) {
                   this.horizontalAvailable = false;
               } else {
                   this.verticalAvailable = false;
               }
           }
        };
    }

    static removeFromArray(array, pos) {
        const ret = array[pos];
        const last = array.pop();
        if(pos < array.length) {
            array[pos] = last;
        }
        return ret;
    }

    processCell(pos) {
        const cell = this.getCell(pos);
        if(!cell.horizontalAvailable && !cell.verticalAvailable) {
            return;
        }

        const directionHorizontal = cell.horizontalAvailable;
        const minPos = this.getFurthestPos(pos, directionHorizontal, -1);
        const maxPos = this.getFurthestPos(pos, directionHorizontal, 1);
        const ranges = CrosswordGenerator.getRanges(minPos, maxPos);
        CrosswordGenerator.shuffle(ranges);
        CrosswordGenerator.alignRanges(ranges);
        for (const range of ranges) {
            const wordPos = this.advance(pos, range.start, directionHorizontal);
            const wordIdx = this.findWord(wordPos, range.len, directionHorizontal);
            if (wordIdx != -1) {
                this.placeWord(wordPos, directionHorizontal, wordIdx);
                return;
            }
        }
        this.getCell(pos).disableDirection(directionHorizontal);
    }

    static alignRanges(ranges) {
        if(ranges.length > 1) {
            let pos = ranges.length - 1;
            for (let i = ranges.length - 2; i >= 0; --i) {
                if(ranges[i].len < 4) {
                    CrosswordGenerator.swap(ranges, i, pos--);
                }
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

    getFurthestPos(pos, directionHorizontal, sign) {
        let relativePos = 0;
        while (this.getCell(pos).isAvailable(directionHorizontal)) {
            pos = this.advance(pos, sign, directionHorizontal);
            relativePos += sign;
        }
        return relativePos == 0 ? 0 : relativePos - sign;
    }

    static getRanges(minPos, maxPos) {
        const ranges = [];
        for (let i = minPos; i <= 0; ++i) {
            for (let j = 0; j <= maxPos; ++j) {
                ranges.push({ start: i, len: j - i + 1 });
            }
        }
        return ranges;
    }

    static swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            CrosswordGenerator.swap(array, i, j);
        }
        return array;
    }

    findWord(pos, len, directionHorizontal) {
        for (let i = 0; i != this.dict.length; ++i) {
            const word = this.dict[i];
            if (word.length == len && this.tryPlaceWord(pos, directionHorizontal, word)) {
                return i;
            }
        }
        return -1;
    }

    placeWord(pos, directionHorizontal, wordIdx) {
        const word = this.dict[wordIdx];
        this.getCell(this.advance(pos, -1, directionHorizontal)).disable();
        this.getCell(this.advance(pos, word.length, directionHorizontal)).disable();

        for (let i = 0; i != word.length; ++i) {
            const curPos = this.advance(pos, i, directionHorizontal);
            const cell = this.getCell(curPos);
            cell.value = word.charAt(i);
            cell.disableDirection(directionHorizontal);
            if (cell.isAvailable(true) || cell.isAvailable(false)) {
                this.availableCells.push(curPos);
            }
        }

        CrosswordGenerator.removeFromArray(this.dict, wordIdx);

        this.words.push({ index: -1, position: pos, isHorizontal: directionHorizontal, text: word });
    }

    tryPlaceWord(pos, directionHorizontal, word) {
        if (this.hasJoint(pos, this.advance(pos, -1, directionHorizontal)) ||
                this.hasJoint(this.advance(pos, word.length - 1, directionHorizontal), this.advance(pos, word.length, directionHorizontal))) {
            return false;
        }

        for (let i = 0; i != word.length; ++i) {
            const curPos = this.advance(pos, i, directionHorizontal);
            const cell = this.getCell(curPos);
            if (cell.isEmpty()) {
                if(!this.getCell(this.advance(curPos, -1, !directionHorizontal)).isEmpty() ||
                        !this.getCell(this.advance(curPos, 1, !directionHorizontal)).isEmpty()) {
                    return false;
                }
            } else if(cell.value !== word.charAt(i)) {
                return false;
            }
        }

        return true;
    }

    getCell(pos) {
        return pos >= 0 && pos < this.size * this.size ? this.cells[pos] : this.emptyCell;
    }

    hasJoint(pos, nextPos) {
        return this.getCell(pos).isEmpty() && !this.getCell(nextPos).isEmpty();
    }

    sortWords() {
        this.words.sort(function(a, b) {return a.position - b.position;});
        let idx = 0;
        let last = -1;
        for(let i = 0; i != this.words.length; ++i) {
            const word = this.words[i];
            if(word.position == last) {
                word.index = idx;
            } else {
                word.index = ++idx;
            }
            last = word.position;
        }
    }
}
