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

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('prototypeContainer','stave');
        this.parentWorkspace.el.appendChild(this.el.baseContainer);

    }

    getRootContainer(){
        return this.el.baseContainer;
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
