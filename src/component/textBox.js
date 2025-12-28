import { ContextMenu } from "@/component/contextMenu.js";

export class TextBox {
    constructor(workspace, textContent = '') {

        this.parentWorkspace = workspace;
        this.contextMenuOptions = [{label: 'duplicate', func: this.duplicate}, {label: 'remove', func: this.remove}];

        this.textContainer = document.createElement('div');
        this.textContainer.classList.add('prototypeContainer','text');
        this.parentWorkspace.el.appendChild(this.textContainer);

        const contextMenu = new ContextMenu(this, this.parentWorkspace);
        this.textContainer.appendChild(contextMenu);

        this.textBox = document.createElement('div');
        this.textBox.classList.add('textBox');
        this.textBox.contentEditable = 'true';
        this.textBox.spellcheck = false;

        if (textContent.includes('<div>')){
            this.textBox.innerHTML = textContent;
        } else {
            this.textBox.textContent = textContent;
        }

        this.textContainer.appendChild(this.textBox);
        
    }

    parseStringContents(){
        let xmlMarkupString = this.textBox.innerHTML;
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
        this.textContainer.remove();
    }

    duplicate(){
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        const cloneTextbox = new TextBox(this.parentWorkspace, this.textBox.innerHTML);
        this.textContainer.insertAdjacentElement('afterend', cloneTextbox.textContainer);
        this.parentWorkspace.ChildObjects.splice(index + 1, 0, cloneTextbox);
    }

    getRootContainer(){
        return this.textContainer;
    }

    getObjectNameAsString(){
        return 'TextBox'
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

