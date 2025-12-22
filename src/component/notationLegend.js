import { ContextMenu } from "@/component/contextMenu.js";
import { TransientInput } from "@/lib/transientInput.js";

export class NotationLegend {
    constructor(workspace, textContent = '') {

        this.parentWorkspace = workspace;

        this.componentContainer = document.createElement('div');
        this.componentContainer.classList.add('prototypeContainer','legend');
        this.parentWorkspace.el.appendChild(this.componentContainer);
        
        const contextMenu = new ContextMenu(this, this.parentWorkspace);
        this.componentContainer.appendChild(contextMenu);

        this.legendContainer = document.createElement('div');
        this.legendContainer.classList.add('notationLegend');
        this.legendContainer.innerHTML += '<div class="divider">***********************************</div><div class="entriesContainer"></div><div class="divider">***********************************</div>';

        this.entriesContainer = this.legendContainer.querySelector('.entriesContainer');

        this.techniqueEntries = [];

        this.techniqueEntries.push(new TechniqueEntry(this, 'PM', 'Palm Mute'));
        this.techniqueEntries.push(new TechniqueEntry(this, '/', 'Slide Up'));
        this.techniqueEntries.push(new TechniqueEntry(this, 'PMAB', 'Palm Mute'));

        this.componentContainer.appendChild(this.legendContainer);
    }

    parseStringContents(){
        let xmlMarkupString = this.legendContainer.innerHTML;
        let outputMarkup = "";
        
        
        function parseTags(prevOpen, prevClose){
            let openTag = xmlMarkupString.indexOf('<div>', prevOpen + 1);
            let closeTag = xmlMarkupString.indexOf('</div>', prevClose + 1);
            if (openTag > 0 && closeTag > 0){
                outputMarkup += `${xmlMarkupString.slice(openTag + 5, closeTag)}\n`
                parseTags(openTag, closeTag)
            }
            return;
        }
        
        let linebreak = xmlMarkupString.indexOf('<div>');
        if (linebreak > 0){
            outputMarkup += `${xmlMarkupString.slice(0, linebreak)}\n`
            parseTags(-1, -1)
        } else {
            outputMarkup = `${xmlMarkupString.trimEnd()}\n`;
        }

        const textBuffer = outputMarkup;
        return textBuffer;
    }

    remove(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.componentContainer.remove();
    }

    duplicate(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        const cloneTextbox = new TextBox(this.parentWorkspace, this.legendContainer.innerHTML);
        this.componentContainer.insertAdjacentElement('afterend', cloneTextbox.componentContainer);
        this.parentWorkspace.ChildObjects.splice(index + 1, 0, cloneTextbox);
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
        this.symbol += '\u00A0'.repeat(3);
        this.symbol = this.symbol.slice(0, 3);

        this.description = _description

        this.componentContainer.textContent = `| ${this.symbol} ${this.description}`
        
        parentObject.entriesContainer.appendChild(this.componentContainer);
        
        this.componentContainer.addEventListener('mousedown', (event) => {
            if (event.button == 2){
                const editEntryMenu = new TransientInput;
                editEntryMenu.setPosition(event, null);
                editEntryMenu.createAndAddLabel('Notation Legend entry');
                editEntryMenu.createAndAddDivisor();
                editEntryMenu.createAndAddLabel('symbol');
                editEntryMenu.createAndAddTextInput(this.symbol.trim(), (contents) => {
                    if (!contents.length) { return false; };
                    contents = contents.trim();
                    contents += '\u00A0'.repeat(3);
                    contents = contents.slice(0, 3);
                    this.symbol = contents;
                    this.componentContainer.textContent = `| ${this.symbol} ${this.description}`
                    return true;
                }, /^[A-Za-z/# ]+$/);
                editEntryMenu.createAndAddLabel('description');
                editEntryMenu.createAndAddTextInput(this.description.trim(), (contents) => {
                    if (!contents.length) { return false; };
                    contents = contents.trim();
                    contents = contents.slice(0, 20);
                    this.description = contents;
                    this.componentContainer.textContent = `| ${this.symbol} ${this.description}`
                    return true;
                }, /^[A-Za-z/# ]+$/);
                editEntryMenu.createAndAddDivisor();
                editEntryMenu.createAndAddButton('remove', ()=>{
                    const idx = parentObject.techniqueEntries.indexOf(this);
                    parentObject.techniqueEntries.splice(idx, 1);
                    this.remove();
                    return true;
                });
                editEntryMenu.endTransientInput();
            } else {

            }
        })

    }

    remove(){
        this.componentContainer.remove();
    }
}
