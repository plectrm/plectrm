import { DragHandle } from "@/component/dragHandle.js";
import { Popover } from "@/lib/popover.js";

export class NotationLegend {
    constructor(workspace, textContent = '') {

        this.parentWorkspace = workspace;
        this.contextMenuOptions = [{label: 'remove', func: this.remove}];

        this.componentContainer = document.createElement('div');
        this.componentContainer.classList.add('prototypeContainer','legend');
        this.parentWorkspace.el.appendChild(this.componentContainer);
        
        const contextMenu = new DragHandle(this, this.parentWorkspace);
        this.componentContainer.appendChild(contextMenu);

        this.legendContainer = document.createElement('div');
        this.legendContainer.classList.add('notationLegend');
        this.legendContainer.innerHTML += '<div class="divider">***********************************</div><div class="entriesContainer"></div><div class="divider">***********************************</div>';

        this.entriesContainer = this.legendContainer.querySelector('.entriesContainer');
        new NewEntryButton(this);

        this.techniqueEntries = [];

        this.techniqueEntries.push(new TechniqueEntry(this, 'PM', 'Palm Mute'));
        this.techniqueEntries.push(new TechniqueEntry(this, '/', 'Slide Up'));
        this.techniqueEntries.push(new TechniqueEntry(this, 'PMAB', 'Palm Mute'));


        this.componentContainer.appendChild(this.legendContainer);

    }

    parseStringContents(){
        let textBuffer = "";
        textBuffer += '***********************************\n';
        const entries = this.techniqueEntries
        for (let i = 0; i < entries.length; i++){
            let symbol = entries[i].symbol.trim();
            symbol += ' '.repeat(4)
            symbol = symbol.substring(0, 4);
            let description = entries[i].description.trim();
            textBuffer += `|${symbol}${description}\n`;
        }
        textBuffer += '***********************************\n';
        return textBuffer;
    }

    remove(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.componentContainer.remove();
    }

    getRootContainer(){
        return this.componentContainer;
    }

    getObjectNameAsString(){
        return 'Notation Legend'
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

class TechniqueEntry{
    constructor(parentObject, _symbol, _description){
        this.componentContainer = document.createElement('div');
        this.componentContainer.classList.add('entry');

        this.symbol = _symbol.trim();
        this.symbol = this.symbol.substring(0, 3);

        this.description = _description;

        this.componentContainer.innerHTML=`|<span id="symbol">${this.symbol}</span><span id="description">${this.description}</span>`
        this.symbolContainer = this.componentContainer.querySelector('#symbol');
        this.descriptionContainer = this.componentContainer.querySelector('#description');

        this.symbolContainer.contentEditable = true;
        this.descriptionContainer.contentEditable = true;

        this.componentContainer.spellcheck=false;
        
        parentObject.entriesContainer.appendChild(this.componentContainer);

        this.symbolContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter'){
                event.preventDefault();
            } else if (event.key.length > 1) {
                return;
            } else {
                if (this.symbolContainer.textContent.length > 2 && !event.ctrlKey){
                    event.preventDefault();
                }
                this.symbol = this.symbolContainer.textContent.trim();
                this.symbol += event.key;
                this.symbol = this.symbol.substring(0, 3);
            }
        });

        this.symbolContainer.addEventListener('blur', () => {
            this.symbolContainer.textContent = this.symbol
        });

        this.descriptionContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter'){
                event.preventDefault();
            } else if (event.key.length > 1) {
                return;
            } else {
                if (this.descriptionContainer.textContent.length > 26 && !event.ctrlKey){
                    event.preventDefault();
                }
                this.description = this.descriptionContainer.textContent.trim();
                this.description += event.key;
                this.description = this.description.substring(0, 27);
            }
        });

        this.symbolContainer.addEventListener('blur', () => {
            this.symbolContainer.textContent = this.symbol
        });
        
        this.componentContainer.addEventListener('mousedown', (event) => {
            if (event.button == 2){
                event.preventDefault()
                const editEntryMenu = new Popover(this.componentContainer, {x: event.pageX,y: event.pageY});
                editEntryMenu.createAndAddLabel('Notation legend entry');
                editEntryMenu.createAndAddDivisor();
                editEntryMenu.createAndAddButton('edit text', ()=>{
                    const target = event.target.id === 'description' ? 'description' : 'symbol';
                    if (target === 'symbol'){
                        this.symbolContainer.focus();
                    } else {
                        this.descriptionContainer.focus();
                    }
                    return true;
                });
                editEntryMenu.createAndAddButton('remove', ()=>{
                    const idx = parentObject.techniqueEntries.indexOf(this);
                    parentObject.techniqueEntries.splice(idx, 1);
                    this.remove();
                    return true;
                });
                editEntryMenu.endPopover();
            } else {

            }
        })

    }

    remove(){
        this.componentContainer.remove();
    }
}

class NewEntryButton{
    constructor(parentObject){
        this.componentContainer = document.createElement('div');
        this.componentContainer.classList.add('newEntry');

        this.componentContainer.textContent = '+ Add Entry';
        this.componentContainer.title = "Add Entry";
        
        parentObject.entriesContainer.appendChild(this.componentContainer);
        
        this.componentContainer.addEventListener('mouseup', (event) => {
            if (event.button == 0){
                parentObject.techniqueEntries.push(new TechniqueEntry(parentObject, 'PM', 'Palm Mute'));
            } else {

            }
        })

    }

    remove(){
        this.componentContainer.remove();
    }
}
