import { DragHandle } from "@/component/dragHandle.js";
import { TransientInput } from "@/lib/transientInput.js";

/**
 * A text box component for freeform text input within the workspace.
 */
export class TextBox {
    /**
     * Creates a TextBox.
     * @param {Workspace} workspace - The parent workspace for the textBox.
     * @param {string} [textContent=''] - Initial text content (can include HTML).
     */
    constructor(workspace, textContent = '') {
        this.parentWorkspace = workspace;

        /** @member {Object} el - Contains all HTML Elements associated with this object */
        this.el = {};

        /** @member {Array} contextMenuOptions - Options for the right-click context menu */
        this.contextMenuOptions = [
            { label: 'duplicate', func: this.duplicate },
            { label: 'remove', func: this.remove }
        ];

        this.el.baseContainer = document.createElement('div');
        this.el.baseContainer.classList.add('prototypeContainer', 'text');
        this.parentWorkspace.el.appendChild(this.el.baseContainer);

        this.el.dragHandle = new DragHandle(this, this.parentWorkspace);
        this.el.baseContainer.appendChild(this.el.dragHandle);

        this.el.textBox = document.createElement('div');
        this.el.textBox.classList.add('textBox');
        this.el.textBox.contentEditable = 'true';
        this.el.textBox.spellcheck = false;

        if (textContent.includes('<div>')) {
            this.el.textBox.innerHTML = textContent;
        } else {
            this.el.textBox.textContent = textContent;
        }

        this.el.baseContainer.appendChild(this.el.textBox);

        // Right-click context menu handler on the entire component
        this.el.baseContainer.addEventListener('mousedown', (event) => {
            if (event.button !== 2) { return; }
            event.preventDefault();

            const popUpContextMenu = new TransientInput(this.el.baseContainer, { x: event.pageX, y: event.pageY });
            popUpContextMenu.createAndAddLabel(this.constructor.name);
            popUpContextMenu.createAndAddDivisor();

            for (let i = 0; i < this.contextMenuOptions.length; i++) {
                popUpContextMenu.createAndAddButton(this.contextMenuOptions[i].label, () => {
                    const f = this.contextMenuOptions[i].func.bind(this);
                    f();
                    return true;
                });
            }

            popUpContextMenu.endTransientInput();
        });
    }

    /**
     * Parses the textBox contents into a plain text string.
     * Converts <div> elements to newlines.
     * @returns {string} The parsed text content.
     */
    parseStringContents() {
        let xmlMarkupString = this.el.textBox.innerHTML;
        let outputMarkup = "";

        function parseTags(prevOpen, prevClose) {
            let openTag = xmlMarkupString.indexOf('<div>', prevOpen + 1);
            let closeTag = xmlMarkupString.indexOf('</div>', prevClose + 1);
            if (openTag > 0 && closeTag > 0) {
                outputMarkup += `${xmlMarkupString.slice(openTag + 5, closeTag)}\n`
                parseTags(openTag, closeTag)
            }
            return;
        }

        let linebreak = xmlMarkupString.indexOf('<div>');
        if (linebreak > 0) {
            outputMarkup += `${xmlMarkupString.slice(0, linebreak)}\n`
            parseTags(-1, -1)
        } else {
            outputMarkup = `${xmlMarkupString.trimEnd()}\n`;
        }

        return outputMarkup;
    }

    /**
     * Removes this textBox from the workspace and cleans up DOM elements.
     */
    remove() {
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.el.baseContainer.remove();
    }

    /**
     * Duplicates this textBox, inserting the copy immediately after this one.
     */
    duplicate() {
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        const cloneTextbox = new TextBox(this.parentWorkspace, this.el.textBox.innerHTML);
        this.el.baseContainer.insertAdjacentElement('afterend', cloneTextbox.el.baseContainer);
        this.parentWorkspace.ChildObjects.splice(index + 1, 0, cloneTextbox);
    }

    /**
     * Returns the root element of this component.
     * @returns {HTMLDivElement}
     */
    getRootContainer() {
        return this.el.baseContainer;
    }

    /**
     * Decreases this textBox's position in the workspace (moves up).
     */
    decPositionInWorkspace() {
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.parentWorkspace.ChildObjects.splice(index - 1, 0, this);
    }

    /**
     * Increases this textBox's position in the workspace (moves down).
     */
    incPositionInWorkspace() {
        const index = this.parentWorkspace.ChildObjects.indexOf(this);
        this.parentWorkspace.ChildObjects.splice(index, 1);
        this.parentWorkspace.ChildObjects.splice(index + 1, 0, this);
    }
}
