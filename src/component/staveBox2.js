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

        this.staveGrid = new staveGrid(this.parentWorkspace, this.el.staveBoxGrid, this.cellArray);

    }

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
            rowArray.push({idx: idx, value: '-'})
        }
        cellArray.push(rowArray)
    }
    return cellArray;
}

/**
 * The grid of cells which makes up the main contents of a staveBox.
 * @param {Workspace} workspace - staveBox's parent workspace.
 * @param {HTMLDivElement} gridContainer - Element to contain staveGrid.
 * @param {[]} cellArray - 2d array of cell values to link grid with.
 */

class staveGrid {
    constructor (workspace, gridContainer, cellArray){
        const rows = cellArray.length;
        const cols = cellArray[0].length;
        const arr = cellArray.flat(1);

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        this.el.baseContainer = gridContainer;

        let gridContent = "";

        this.el.baseContainer.style.width = `${cols * workspace.emSize.width}px`;
        this.el.baseContainer.style.lineHeight = `${workspace.emSize.height * 1.05}px`;

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

        this.el.baseContainer.addEventListener('mousemove', (event) => {
            if (event.target !== this.el.baseContainer) { return; }
            const position = {
                x: Math.min(Math.trunc(Math.max(event.offsetX, 0) / workspace.emSize.width), cols - 1),
                y: Math.min(Math.trunc(Math.max(event.offsetY, 0) / (workspace.emSize.height * 1.05)), rows - 1)}

            this.el.hoverHighlight.style.transform = `translate(${position.x * workspace.emSize.width}px, ${position.y * (workspace.emSize.height * 1.05)}px)`;
            const idx = (position.x) + (position.y * cols)
            this.el.hoverHighlight.textContent = arr.at(idx).value.trim();
        })

    }
}