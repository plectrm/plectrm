import { ContextMenu } from "@/component/contextMenu.js";
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
        this.tuning = tuning;

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        /** @member {Object[]} cellArray - A 2d array containing all the staveBox's grid's values and indexes.  */
        this.cellArray = initCellArray(options.length, tuning.length, options.clonedCellArray);

        /** @member {number} length - Length of the staveBox's grid  */
        this.length = this.cellArray[0].length;

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('prototypeContainer','stave');
        this.parentWorkspace.el.appendChild(this.el.baseContainer);

        this.el.contextMenu = new ContextMenu(this, this.parentWorkspace);
        this.el.baseContainer.appendChild(this.el.contextMenu);

        this.el.staveBox = document.createElement('div');
        this.el.staveBox.classList.add('staveBox');
        this.el.baseContainer.appendChild(this.el.staveBox);

        this.el.stringLabels = document.createElement('div');
        this.el.stringLabels.classList.add('staveTuningContainer');
        this.el.stringLabels.title = "Change Tuning";
        this.el.staveBox.appendChild(this.el.stringLabels);
        
        this.el.staveEnd = document.createElement('div');
        this.el.staveEnd.classList.add('staveEnd');
        this.el.staveEnd.textContent = '|\r'.repeat(this.tuning.length);
        
        this.setTuning(this.tuning);

        this.el.staveEnd.addEventListener('mousedown', (event) => {
            
            const rect = this.el.staveContainer.getBoundingClientRect();

            const lengthHelper = new TransientInput(event.target, {x: rect.right, y: rect.bottom});
            lengthHelper.createAndAddLabel('length');
            lengthHelper.createAndAddLabel(() => `${this.length}`);
            lengthHelper.endTransientInput();

            document.addEventListener('mousemove', resizeHandler())
            this.el.staveEnd.focus();
            this.el.staveEnd.classList.add('focus');
            
            document.addEventListener('mouseup', () => {
                document.body.style.cursor = 'auto';
                this.el.staveEnd.classList.remove('focus');
                document.removeEventListener('mousemove', resizeHandler())
                lengthHelper.remove();
            })

        });
        this.el.staveBox.appendChild(this.el.staveEnd);

        this.el.staveBoxGrid = document.createElement('div');
        this.el.staveBoxGrid.classList.add('staveGrid');
        this.el.staveBox.appendChild(this.el.staveBoxGrid);

        this.staveGrid = new staveGrid(this, this.cellArray);

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
        this.el.stringLabels.textContent = '';
        let tuning = _tuning;
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
            this.el.stringLabels.appendChild(textContainer);
        }
        this.el.staveEnd.textContent = '|\r'.repeat(this.tuning.length);
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
 * @param {[]} [cloneArray] - Array of cell values to copy from.
 */

function initCellArray(x, y, cloneArray = []){
    const cellArray = []
    for (let row = 0; row < y; row++){
        const rowArray = []
        for (let col = 0; col < x; col++){
            const idx = (x * row) + (col);
            const value = cloneArray[idx] ? cloneArray[i] : '-';
            rowArray.push({idx: idx, value: value})
        }
        cellArray.push(rowArray)
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
        
        this.mouseState = { activeCell: { x: 0, y: 0 }, lastClicked:{ x: 0, y: 0 }, focus: false, inputDirection: Direction.Vertical, }

        let gridContent = "";
        
        this.staveBox = stavebox;
        this.parentWorkspace = stavebox.parentWorkspace;
        
        const rows = this.staveBox.cellArray.length;
        const cols = this.staveBox.cellArray[0].length;
        const arr = this.staveBox.cellArray.flat(1);

        this.el.baseContainer = this.staveBox.el.staveBoxGrid;
        this.el.baseContainer.style.width = `${cols * this.parentWorkspace.emSize.width}px`;
        this.el.baseContainer.style.lineHeight = `${this.parentWorkspace.emSize.height * 1.05}px`;

        for (let y = 0; y < rows; y++){
            for (let x = 0; x < cols; x++){
                const idx = (x * rows) + (y);
                gridContent += arr.at(idx).value.trim();
            }
            gridContent += `\n`;
        }
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
                x: Math.min(Math.trunc(Math.max(event.offsetX, 0) / this.parentWorkspace.emSize.width), cols - 1),
                y: Math.min(Math.trunc(Math.max(event.offsetY, 0) / (this.parentWorkspace.emSize.height * 1.05)), rows - 1)
            }

            this.el.hoverHighlight.style.transform = `translate(${position.x * this.parentWorkspace.emSize.width}px, ${position.y * (this.parentWorkspace.emSize.height * 1.05)}px)`;
            const idx = (position.x) + (position.y * cols)
            this.el.hoverHighlight.textContent = arr.at(idx).value.trim();
        });

        // handle click events
        this.el.baseContainer.addEventListener('mousedown', (event) => {
            if (event.target !== this.el.baseContainer) { return; }

            // left click
            if (event.button === 0){
                event.preventDefault();
                const position = {
                    x: Math.min(Math.trunc(Math.max(event.offsetX, 0) / this.parentWorkspace.emSize.width), cols - 1),
                    y: Math.min(Math.trunc(Math.max(event.offsetY, 0) / (this.parentWorkspace.emSize.height * 1.05)), rows - 1)
                }

                this.mouseState.activeCell = position;
                this.mouseState.focus = true;
                
                // consecutive clicks on the same cell changes input direction
                if ((this.mouseState.activeCell.x === this.mouseState.lastClicked.x) && (this.mouseState.activeCell.y === this.mouseState.lastClicked.y)){
                    this.mouseState.inputDirection = this.mouseState.inputDirection == Direction.Vertical ? Direction.Horizontal : Direction.Vertical; 
                }
                
                this.draw();
                Object.assign(this.mouseState, { lastClicked:{ x: position.x, y: position.y }} );
            }
        })

        document.body.addEventListener('mousedown', (event) => {
            if (this.el.baseContainer.contains(event.target)){ return; };
            this.mouseState.focus = false;
            this.draw();
        })

        // handle keyboard events
        document.body.addEventListener('keydown', (event) => {
            if (!this.mouseState.focus) { return; };
            event.preventDefault();

            const key = event.code;

            if (key === 'Space'){
                this.mouseState.inputDirection = this.mouseState.inputDirection == Direction.Vertical ? Direction.Horizontal : Direction.Vertical; 
            } else if (key.includes('Key') || key.includes('Digit')){
                // if key pressed is a valid cell value then change its contents
                const character = event.key;

                this.setCell(this.mouseState.activeCell.x, this.mouseState.activeCell.y, character);

                this.advancePointer();
            } else if (key.includes('Arrow')){
                switch (key) {
                    case "ArrowUp":
                        this.mouseState.inputDirection = Direction.Vertical;
                        this.advancePointer();
                        break;
                    case "ArrowDown":
                        this.mouseState.inputDirection = Direction.Vertical;
                        this.retreatPointer();
                        break;
                    case "ArrowRight":
                        this.mouseState.inputDirection = Direction.Horizontal;
                        this.advancePointer();
                        break;
                    case "ArrowLeft":
                        this.mouseState.inputDirection = Direction.Horizontal;
                        this.retreatPointer();
                        break;
                    default:
                        break;
                }
            }

            this.draw();
        })
    }

    /**
     * Updates and draws changes to staveGrid's elements.
     */
    draw(){
        if (this.mouseState.focus){
            this.el.activeHighlight.focus();

            // render direction highlight
            if (this.mouseState.inputDirection == Direction.Horizontal){
                const cells = this.staveBox.cellArray[this.mouseState.activeCell.y];
                let content = "";
                cells.forEach(cell => {
                    content += cell.value.trim();
                });
                
                this.el.directionHighlight.textContent = content;
                this.el.directionHighlight.style.width = 'fit-content';
                this.el.directionHighlight.style.height = 'fit-content';
                this.el.directionHighlight.style.letterSpacing = '0.5em';
                this.el.directionHighlight.style.transform = `translate(0px, ${(this.mouseState.activeCell.y * this.parentWorkspace.emSize.height) + (this.mouseState.activeCell.y)}px)`

            } else if (this.mouseState.inputDirection == Direction.Vertical) {
                let content = "";
                this.staveBox.cellArray.forEach(row => {
                    content += row[this.mouseState.activeCell.x].value.trim();
                    content += `\n`;
                });

                this.el.directionHighlight.textContent = content;
                this.el.directionHighlight.style.width = '1em';
                this.el.directionHighlight.style.height = `${this.staveBox.cellArray.length * this.parentWorkspace.emSize.height}px`;
                this.el.directionHighlight.style.letterSpacing = 'normal';
                this.el.directionHighlight.style.transform = `translate(${(this.mouseState.activeCell.x * (this.parentWorkspace.emSize.width * 1))}px, 2px)`
            }

            // render selected cell
            const content = this.staveBox.cellArray[this.mouseState.activeCell.y][this.mouseState.activeCell.x].value;
            this.el.activeHighlight.textContent = content;
            this.el.activeHighlight.style.transform = `translate(${this.mouseState.activeCell.x * this.parentWorkspace.emSize.width}px, ${this.mouseState.activeCell.y * (this.parentWorkspace.emSize.height * 1.05)}px)`;
        } else {

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

    advancePointer() {
        let nextCell = { x: 0, y: 0 };
        if ( this.mouseState.inputDirection == Direction.Vertical ){
            if (this.mouseState.activeCell.y === 0){
                nextCell.x = this.mouseState.activeCell.x == this.staveBox.length - 1 ? this.mouseState.activeCell.x : this.mouseState.activeCell.x + 1;
                nextCell.y = this.staveBox.tuning.length - 1;
            } else {
                nextCell.x = this.mouseState.activeCell.x;
                nextCell.y = this.mouseState.activeCell.y - 1;
            }
        } else if( this.mouseState.inputDirection == Direction.Horizontal ) {
            if (this.mouseState.activeCell.x === this.staveBox.length - 1) {
                nextCell.x = 0;
                nextCell.y = this.mouseState.activeCell.y === this.staveBox.tuning.length - 1 ? this.mouseState.activeCell.y : this.mouseState.activeCell.y + 1;
            } else {
                nextCell.x = this.mouseState.activeCell.x === this.staveBox.length - 1 ? 0 : this.mouseState.activeCell.x + 1;
                nextCell.y = this.mouseState.activeCell.y;
            }
        }
        this.mouseState.activeCell = nextCell;
    }

    retreatPointer(){
        let nextCell = { x: 0, y: 0 };
        if ( this.mouseState.inputDirection == Direction.Vertical ){
            if (this.mouseState.activeCell.y === this.staveBox.tuning.length - 1){
                nextCell.x = this.mouseState.activeCell.x === 0 ? this.mouseState.activeCell.x : this.mouseState.activeCell.x - 1;
                nextCell.y = 0;
            } else {
                nextCell.x = this.mouseState.activeCell.x;
                nextCell.y = this.mouseState.activeCell.y + 1;
            }
        } else if( this.mouseState.inputDirection == Direction.Horizontal ) {
            if (this.mouseState.activeCell.x === 0) {
                nextCell.x = this.staveBox.length - 1;
                nextCell.y = this.mouseState.activeCell.y;
            } else {
                nextCell.x = this.mouseState.activeCell.x - 1;
                nextCell.y = this.mouseState.activeCell.y;
            }
        }
        this.mouseState.activeCell = nextCell;
    }
}

const Direction = {
    Horizontal: 'Horizontal',
    Vertical: 'Vertical'
}