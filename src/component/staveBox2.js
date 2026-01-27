import { DragHandle } from "@/component/dragHandle.js";
import { TransientInput } from "@/lib/transientInput.js";

export class StaveBox2 {
    /**
     * Creates a staveBox.
     * @param {Workspace} workspace - The parent workspace for the staveBox.
     * @param {string[]} tuning - The staveBox's inital tuning.
     * @param {object} [staveBoxOptions] - Optional staveBox options.
     * @param {number} [staveBoxOptions.length] - Length of staveBox.
     * @param {[]} [staveBoxOptions.clonedCellArray] - Array of cell values to copy from.
     */
    constructor(workspace, tuning = ['E', 'A', 'D', 'G', 'B', 'e'], staveBoxOptions = { length: 24,  clonedCellArray: [] }) {
        
        const options = staveBoxOptions;
        this.parentWorkspace = workspace;

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        this.tuning = tuning;

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('prototypeContainer','stave');
        this.parentWorkspace.el.appendChild(this.el.baseContainer);

        this.el.contextMenu = new DragHandle(this, this.parentWorkspace);
        this.el.baseContainer.appendChild(this.el.contextMenu);

        this.el.staveBox = document.createElement('div');
        this.el.staveBox.classList.add('staveBox');
        this.el.baseContainer.appendChild(this.el.staveBox);

        this.staveTuning = new staveTuning(this, tuning);

        /** @member {Object[]} cellArray - A 2d array containing all the staveBox's grid's values and indexes.  */
        this.cellArray = initCellArray(options.length, tuning.length, options.clonedCellArray);

        /** @member {number} length - Length of the staveBox's grid  */
        this.length = this.cellArray[0].length;

        this.el.staveBoxGrid = document.createElement('div');
        this.el.staveBoxGrid.classList.add('staveGrid');
        this.el.staveBox.appendChild(this.el.staveBoxGrid);

        this.staveGrid = new staveGrid(this, this.cellArray);

        this.staveEnd = new staveEnd(this);

    }

    /**
     * Returns the root element of this component.
     * @returns {HTMLDivElement}
     */
    getRootContainer(){
        return this.el.baseContainer;
    }

    /**
     * Sets the tuning of a staveBox.
     * @param {string[]} _tuning - Tuning to change to as an array of strings.
     */
    setTuning(_tuning){
        this.tuning = _tuning;
        this.staveTuning.updateTuning(_tuning);
    }

    decPositionInWorkspace(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.parentWorkspace.ChildObjects.splice(index - 1, 0, this);
    }

    incPositionInWorkspace(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.parentWorkspace.ChildObjects.splice(index + 1, 0, this);
    }
}

/**
 * Initialises an array of cells to store staveBox values.
 * @param {number} x - Column count.
 * @param {number} y - Row count.
 * @param {[[{value: string, idx: number}]]} cloneArray - Two dimentional array of cell values to copy from. Cells without a valid value will be defaulted.
 */

function initCellArray(x, y, cloneArray = false){
    const cellArray = []
    if (!cloneArray || cloneArray.length < 1){
        for (let row = 0; row < y; row++){
            const rowArray = []
            for (let col = 0; col < x; col++){
                const idx = (x * row) + (col);
                const value = '-';
                rowArray.push({idx: idx, value: value})
            }
            cellArray.push(rowArray);
        }
    } else {
        cloneArray.forEach((row, y) => {
            const rowArray = []
            row.forEach((cell, x )=> {
                const idx = (y * cloneArray[0].length) + x;
                let value;
                if (typeof cell !== 'object'){
                    value = '-';
                } else {
                    value = typeof cell.value ? cell.value : '-';
                }
                rowArray.push({idx: idx, value: value})
            })
            cellArray.push(rowArray);
        })
    } 
    return cellArray;
}

/**
 * The grid of cells which makes up the main contents of a staveBox.
 * @param {StaveBox2} stavebox - staveBox object to bind to.
 */

class staveGrid {
    constructor (stavebox){

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};
        
        /** @member {Object} state - Contains attributes pertaining to the current state as changed by the user */
        this.state = { activeCell: { x: 0, y: 0 }, lastClicked:{ x: 0, y: 0 }, focus: false, inputDirection: Direction.Vertical, }

        let gridContent = "";
        
        this.staveBox = stavebox;
        this.parentWorkspace = stavebox.parentWorkspace;

        this.el.baseContainer = this.staveBox.el.staveBoxGrid;
        this.el.baseContainer.style.lineHeight = `${this.parentWorkspace.emSize.height * 1.05}px`;

        this.staveBox.cellArray.forEach((row) => {
            row.forEach(cell => {
                gridContent += cell.value;
            })
            gridContent += `\n`;
        })

        this.el.baseContainer.textContent = gridContent;

        this.el.hoverHighlight = document.createElement('div');
        this.el.hoverHighlight.classList.add('cellHighlight');
        this.el.baseContainer.appendChild(this.el.hoverHighlight);

        this.el.directionHighlight = document.createElement('div');
        this.el.directionHighlight.classList.add('cellDirection');
        this.el.baseContainer.appendChild(this.el.directionHighlight);

        this.el.activeHighlight = document.createElement('div');
        this.el.activeHighlight.classList.add('cellActive');
        this.el.baseContainer.appendChild(this.el.activeHighlight);

        // handle hover events
        this.el.baseContainer.addEventListener('mousemove', (event) => {
            if (event.target !== this.el.baseContainer) { return; }
            const position = {
                x: Math.min(Math.trunc(Math.max(event.offsetX, 0) / (this.parentWorkspace.emSize.width * 1.015)), this.staveBox.cellArray[0].length - 1),
                y: Math.min(Math.trunc(Math.max(event.offsetY, 0) / (this.parentWorkspace.emSize.height * 1.05)), this.staveBox.cellArray.length - 1)
            }

            this.el.hoverHighlight.style.transform = `translate(${position.x * (this.parentWorkspace.emSize.width * 1.015)}px, ${position.y * (this.parentWorkspace.emSize.height * 1.06)}px)`;
        });

        // handle click events
        this.el.baseContainer.addEventListener('mousedown', (event) => {
            if (event.target !== this.el.baseContainer) { return; }

            // left click
            if (event.button === 0){
                event.preventDefault();
                const position = {
                    x: Math.min(Math.trunc(Math.max(event.offsetX, 0) / (this.parentWorkspace.emSize.width * 1.015)), this.staveBox.cellArray[0].length - 1),
                    y: Math.min(Math.trunc(Math.max(event.offsetY, 0) / (this.parentWorkspace.emSize.height * 1.05)), this.staveBox.cellArray.length - 1)
                }

                this.state.activeCell = position;
                this.state.focus = true;
                
                // consecutive clicks on the same cell changes input direction
                if ((this.state.activeCell.x === this.state.lastClicked.x) && (this.state.activeCell.y === this.state.lastClicked.y)){
                    this.state.inputDirection = this.state.inputDirection == Direction.Vertical ? Direction.Horizontal : Direction.Vertical; 
                }
                
                this.draw();
                Object.assign(this.state, { lastClicked:{ x: position.x, y: position.y }} );
            }
        })

        document.body.addEventListener('mousedown', (event) => {
            if (this.el.baseContainer.contains(event.target)){ return; };
            this.state.focus = false;
            this.draw();
        })

        // handle keyboard events
        document.body.addEventListener('keydown', (event) => {
            if (!this.state.focus) { return; };
            event.preventDefault();

            const key = event.code;

            if (key === 'Space'){
                // switch input direction
                this.state.inputDirection = this.state.inputDirection == Direction.Vertical ? Direction.Horizontal : Direction.Vertical; 
            } else if (key === 'Backspace') {
                this.setCell(this.state.activeCell.x, this.state.activeCell.y, '-');

            // holding alt while backspacing should not move pointer
                if (!event.altKey) { this.retreatPointer(); }; 
                
            } else if (key.includes('Arrow')){
                // move pointer
                const previousInputDirection = this.state.inputDirection;
                switch (key) {
                    case "ArrowUp":
                        this.state.inputDirection = Direction.Vertical;
                        this.advancePointer();
                        break;
                    case "ArrowDown":
                        this.state.inputDirection = Direction.Vertical;
                        this.retreatPointer();
                        break;
                    case "ArrowRight":
                        this.state.inputDirection = Direction.Horizontal;
                        this.advancePointer();
                        break;
                    case "ArrowLeft":
                        this.state.inputDirection = Direction.Horizontal;
                        this.retreatPointer();
                        break;
                    default:
                        break;
                }

                // holding alt while traversing should move without changing input direction
                if (event.altKey){ this.state.inputDirection = previousInputDirection }
            } else if (key.includes('Key') || key.includes('Digit') || /^[\/~]$/.test(event.key)){
                // if key pressed is a valid cell value then change its contents
                const character = event.key;

                this.setCell(this.state.activeCell.x, this.state.activeCell.y, character);

                // holding alt while entering character should not move pointer
                if (!event.altKey){ this.advancePointer(); };
                
            }

            this.draw();
        })
    }

    /**
     * Updates and draws changes to staveGrid's elements.
     */
    draw(){
        if (this.state.focus){
            this.el.baseContainer.classList.toggle('focus', true)

            // render direction highlight
            if (this.state.inputDirection == Direction.Horizontal){
                this.el.directionHighlight.style.width = `${this.staveBox.length + 1}em`;
                this.el.directionHighlight.style.height = '1em';
                this.el.directionHighlight.style.letterSpacing = '0.5em';
                this.el.directionHighlight.style.transform = `translate(1px, ${this.state.activeCell.y * (this.parentWorkspace.emSize.height * 1.06)}px)`;

            } else if (this.state.inputDirection == Direction.Vertical) {
                this.el.directionHighlight.style.width = '1em';
                this.el.directionHighlight.style.height = `${this.staveBox.cellArray.length * (this.parentWorkspace.emSize.height * 1.05)}px`;
                this.el.directionHighlight.style.letterSpacing = 'normal';
                this.el.directionHighlight.style.transform = `translate(${this.state.activeCell.x * (this.parentWorkspace.emSize.width * 1.015)}px, 0px)`;
            }

            // render selected cell
            const content = this.staveBox.cellArray[this.state.activeCell.y][this.state.activeCell.x].value;
            this.el.activeHighlight.textContent = content;

            this.el.activeHighlight.style.transform = `translate(${this.state.activeCell.x * (this.parentWorkspace.emSize.width * 1.015)}px, ${this.state.activeCell.y * (this.parentWorkspace.emSize.height * 1.06)}px)`;
        } else {
            this.el.baseContainer.classList.toggle('focus', false)
        }
    }

    /**
     * Sets a specific cell in a staveGrid to a given value.
     * @param {number} x - Y position of cell to change.
     * @param {number} y - Y position of cell to change.
     * @param {string} value - New value for cell.
     */
    setCell(x, y, value){
        this.staveBox.cellArray[y][x].value = value;
        const arr = this.staveBox.cellArray.flat(1);
        let contents = "";
        arr.forEach((cell, idx) => {
            contents += cell.value.trim();
            if (idx % this.staveBox.cellArray[0].length === (this.staveBox.cellArray[0].length - 1)){
                contents += `\n`;
            }
        })
        this.el.baseContainer.firstChild.nodeValue = contents;
    }

    /**
     * Advances the position of the active cell pointer, dependent on inputDirection
     */
    advancePointer() {
        let nextCell = { x: 0, y: 0 };
        if ( this.state.inputDirection == Direction.Vertical ){
            if (this.state.activeCell.y === 0){
                nextCell.x = this.state.activeCell.x == this.staveBox.length - 1 ? this.state.activeCell.x : this.state.activeCell.x + 1;
                nextCell.y = this.staveBox.tuning.length - 1;
            } else {
                nextCell.x = this.state.activeCell.x;
                nextCell.y = this.state.activeCell.y - 1;
            }
        } else if( this.state.inputDirection == Direction.Horizontal ) {
            if (this.state.activeCell.x === this.staveBox.length - 1) {
                nextCell.x = 0;
                nextCell.y = this.state.activeCell.y === this.staveBox.tuning.length - 1 ? this.state.activeCell.y : this.state.activeCell.y + 1;
            } else {
                nextCell.x = this.state.activeCell.x === this.staveBox.length - 1 ? 0 : this.state.activeCell.x + 1;
                nextCell.y = this.state.activeCell.y;
            }
        }
        this.state.activeCell = nextCell;
    }

    /**
     * Retreats the position of the active cell pointer, dependent on inputDirection
     */
    retreatPointer(){
        let nextCell = { x: 0, y: 0 };
        if ( this.state.inputDirection == Direction.Vertical ){
            if (this.state.activeCell.y === this.staveBox.tuning.length - 1){
                nextCell.x = this.state.activeCell.x === 0 ? this.state.activeCell.x : this.state.activeCell.x - 1;
                nextCell.y = 0;
            } else {
                nextCell.x = this.state.activeCell.x;
                nextCell.y = this.state.activeCell.y + 1;
            }
        } else if( this.state.inputDirection == Direction.Horizontal ) {
            if (this.state.activeCell.x === 0) {
                nextCell.x = this.staveBox.length - 1;
                nextCell.y = this.state.activeCell.y;
            } else {
                nextCell.x = this.state.activeCell.x - 1;
                nextCell.y = this.state.activeCell.y;
            }
        }
        this.state.activeCell = nextCell;
    }

    /**
     * Updates the whole text node of the staveGrid according to its cellArray
     */
    redrawGrid(){
        let gridContent = "";

        this.staveBox.cellArray.forEach((row) => {
            row.forEach(cell => {
                gridContent += cell.value;
            })
            gridContent += `\n`;
        })

        this.el.baseContainer.firstChild.nodeValue = gridContent;
    }
}

class staveTuning {
    /**
     * The element which displays and allows the user to change a staveBox's tuning
     * @param {StaveBox2} stavebox - staveBox object to bind to.
     * @param {[string]} initTuning - initial tuning to display.
     */
    constructor(stavebox, initTuning){

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        this.staveBox = stavebox;
        this.parentWorkspace = stavebox.parentWorkspace;

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('staveTuningContainer');
        this.el.baseContainer.title = "Change Tuning";
        this.staveBox.el.staveBox.appendChild(this.el.baseContainer);


        // set initial tuning and create labels
        this.el.baseContainer.textContent = '';
        let tuning = initTuning;
        let hasAccidentals = /[#b]/.test(tuning);
        for (let i = tuning.length - 1; i >= 0; i--){
            const stringTuning = tuning.at(i);
            let labelText;
            // if current string label has accidental
            if ((stringTuning.length > 1) || !hasAccidentals){
                labelText = `${tuning.at(i)}|`;
            } else {
                labelText = `${tuning.at(i)} |`;
            }
            const textContainer = document.createElement('div');
            textContainer.style.whiteSpace = 'nowrap';
            textContainer.textContent = labelText;
            this.el.baseContainer.appendChild(textContainer);
        }

        this.el.baseContainer.addEventListener('mousedown', (event) => {
            if (event.button !== 0) { return; }
            event.preventDefault();

            const changeTuningMenu = new TransientInput(this.el.baseContainer, {x: event.pageX, y: event.pageY});
            changeTuningMenu.createAndAddLabel('Tuning:');
            changeTuningMenu.createAndAddTextInput(this.staveBox.tuning.join('/'), (contents) => {
                if (!contents.includes('/')) { return false; };
                contents = contents.trim();
                let newTuning = contents.split('/');
                newTuning = newTuning.filter(Boolean);
                this.updateTuning(newTuning);
                return true;
            })
            changeTuningMenu.endTransientInput();
        });
    }

    updateTuning(_tuning){
        this.el.baseContainer.textContent = '';
        let newTuning = _tuning;
        let hasAccidentals = /[#b]/.test(newTuning);
        for (let i = newTuning.length - 1; i >= 0; i--){
            const stringTuning = newTuning.at(i);
            let labelText;
            // if current string label has accidental
            if ((stringTuning.length > 1) || !hasAccidentals){
                labelText = `${newTuning.at(i)}|`;
            } else {
                labelText = `${newTuning.at(i)} |`;
            }
            const textContainer = document.createElement('div');
            textContainer.style.whiteSpace = 'nowrap';
            textContainer.textContent = labelText;
            this.el.baseContainer.appendChild(textContainer);
        }
        this.staveBox.staveEnd.redraw(newTuning.length);

        const prevTuning = this.staveBox.tuning;
        
        if(newTuning === prevTuning.length){
            this.staveBox.tuning = newTuning;
        } else if (newTuning.length > prevTuning.length){
            this.staveBox.tuning = newTuning;
            const prevStr = prevTuning.join('/');
            const newStr = this.staveBox.tuning.join('/');
            const prevCellArray = this.staveBox.cellArray;
            
            // handle whether new values added to start or end of tuning 
            if (newStr.startsWith(prevStr + '/')){
                // add previous cellArray to start of new array to create new row at the top
                const emptyRow = new Array(this.staveBox.length).fill(undefined);
                const newArray = [emptyRow, ...prevCellArray];
                this.staveBox.cellArray = initCellArray(this.staveBox.length, this.staveBox.tuning.length, newArray);
                this.staveBox.staveGrid.redrawGrid();
            } else {
                // add empty array to end of previous cellArray to create new row at the bottom
                const emptyRow = new Array(this.staveBox.length).fill(undefined);
                const newArray = [...prevCellArray, emptyRow];
                this.staveBox.cellArray = initCellArray(this.staveBox.length, this.staveBox.tuning.length, newArray);
                this.staveBox.staveGrid.redrawGrid();
            }
        } else if (newTuning.length < prevTuning.length){
            this.staveBox.tuning = newTuning;
            const prevStr = prevTuning.join('/');
            const newStr = this.staveBox.tuning.join('/');
            const prevCellArray = this.staveBox.cellArray;

            // handle whether values removed from start or end of tuning 
            if (prevStr.startsWith(newStr + '/')){
                const newArray = prevCellArray.slice(0, -1);
                this.staveBox.cellArray = initCellArray(this.staveBox.length, this.staveBox.tuning.length, newArray);
                this.staveBox.staveGrid.redrawGrid();
            } else {
                const newArray = prevCellArray.slice(1);
                this.staveBox.cellArray = initCellArray(this.staveBox.length, this.staveBox.tuning.length, newArray);
                this.staveBox.staveGrid.redrawGrid();
            }
            
        }
    }
}

class staveEnd {
    /**
     * The element which shows the line on the right side of the stavebox and allows the user to change the staveBox's length
     * @param {StaveBox2} stavebox - staveBox object to bind to.
     */
    constructor(stavebox){

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        this.staveBox = stavebox;
        this.parentWorkspace = stavebox.parentWorkspace;

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('staveEnd');
        this.el.baseContainer.textContent = '|\r'.repeat(this.staveBox.tuning.length);

        this.el.baseContainer.addEventListener('mousedown', (event) => {
            if (event.button !== 0) { return; }
            event.preventDefault();
            
            const rect = this.staveBox.el.baseContainer.getBoundingClientRect();
            
            this.lengthHelper = new TransientInput(event.target, {x: rect.right, y: rect.bottom});
            this.lengthHelper.createAndAddLabel('length');
            this.lengthHelper.createAndAddLabel(() => `${this.staveBox.length}`);
            this.lengthHelper.endTransientInput();

            this.el.baseContainer.classList.add('focus');
            document.body.style.cursor = 'col-resize';

            const resizeHandler = (event) => this.handleResize(event);
            
            document.addEventListener('mousemove', resizeHandler);
            
            const mouseUpHandler = () => {
                document.body.style.cursor = 'auto';
                this.el.baseContainer.classList.remove('focus');
                document.removeEventListener('mousemove', resizeHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                this.lengthHelper.remove();
            };
            
            document.addEventListener('mouseup', mouseUpHandler);
        });

        this.staveBox.el.staveBox.appendChild(this.el.baseContainer);
    }

    /**
     * Handles the resize drag operation - updates grid width based on mouse position
     * @param {MouseEvent} event 
     */
    handleResize(event){
        const workspaceRight = this.parentWorkspace.el.getBoundingClientRect().right;
        const mouseX = Math.min(event.clientX, workspaceRight - (this.parentWorkspace.emSize.width * 2));
        
        const gridRect = this.staveBox.el.staveBoxGrid.getBoundingClientRect();
        const cellWidth = gridRect.width / this.staveBox.length;
        const newLength = Math.max(Math.round((mouseX - gridRect.left) / cellWidth), 1);

        if (newLength === this.staveBox.length) { return; }

        this.resizeGrid(newLength);

        const rect = this.staveBox.el.baseContainer.getBoundingClientRect();
        this.lengthHelper.draw({x: rect.right, y: rect.bottom});
    }

    /**
     * Resizes the grid to a new length, preserving existing cell data
     * @param {number} newLength - The new grid length (number of columns)
     */
    resizeGrid(newLength){
        const prevLength = this.staveBox.length;
        const rowCount = this.staveBox.tuning.length;
        
        if (newLength < prevLength) {
            // truncate each row
            for (let row = 0; row < rowCount; row++){
                this.staveBox.cellArray[row] = this.staveBox.cellArray[row].slice(0, newLength);
            }
        } else if (newLength > prevLength) {
            // add new cells to each row
            const diff = newLength - prevLength;
            for (let row = 0; row < rowCount; row++){
                const newCells = Array.from({ length: diff }, (_, i) => ({
                    idx: (row * newLength) + prevLength + i,
                    value: '-'
                }));
                this.staveBox.cellArray[row].push(...newCells);
            }
            // reindex all cells
            for (let row = 0; row < rowCount; row++){
                for (let col = 0; col < newLength; col++){
                    this.staveBox.cellArray[row][col].idx = (row * newLength) + col;
                }
            }
        }

        this.staveBox.length = newLength;
        this.staveBox.staveGrid.redrawGrid();
    }

    redraw(height = this.staveBox.tuning.length){
        this.el.baseContainer.textContent = '|\r'.repeat(height);
    }
}

const Direction = {
    Horizontal: 'Horizontal',
    Vertical: 'Vertical'
}