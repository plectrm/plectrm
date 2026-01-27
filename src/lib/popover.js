/**
 * A popover menu component that displays a floating UI above other elements.
 * Provides buttons, labels, text inputs, and divisors for context menus and form inputs.
 * Only one popover can exist at a time - creating a new one removes any existing popover.
 */
export class Popover {
    /**
     * Creates a Popover.
     * @param {HTMLElement} [target=document.body] - The target element to anchor the popover to. Receives 'focus' class when open.
     * @param {Object} pos - Position for the popover.
     * @param {number} pos.x - X coordinate in pixels.
     * @param {number} pos.y - Y coordinate in pixels.
     */
    constructor(target = document.body, pos = {x: 0, y: 0}) {
        // Remove any existing popover (only one allowed at a time)
        if (document.getElementsByClassName('popoverContainer').length){
            for (let element of document.getElementsByClassName('popoverContainer')){
                element.remove();
            }
        }
        
        /** @member {HTMLElement} target - The element that opened this popover */
        this.target = target;
        /** @member {number} x - X position in pixels */
        this.x = pos.x;
        /** @member {number} y - Y position in pixels */
        this.y = pos.y;
        /** @member {Array} callbackList - Queue of callback functions for popover items */
        this.callbackList = [];

        this.target.classList.add('focus');

        this.popoverContainer = document.createElement('div');
        this.popoverContainer.classList.add('popoverContainer');
        document.body.appendChild(this.popoverContainer);

        this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;

        // Close popover when clicking outside
        this.clickHandler = (_event) => {
            if (!this.popoverContainer.contains(_event.target)){
                _event.preventDefault();
                this.remove();
            }
        }

        // Delay binding
        setTimeout(()=>{
            document.addEventListener('mousedown', this.clickHandler)
        }, 0);
    }

    /**
     * Creates and adds a clickable button to the popover.
     * @param {string} textLabel - The text to display on the button.
     * @param {Function} clickFn - Callback function executed when button is clicked. Should return true on success.
     */
    createAndAddButton(textLabel, clickFn) {
        const popoverButton = document.createElement('div');
        popoverButton.classList.add('popoverItem', 'popoverButton');
        popoverButton.textContent = textLabel;
        this.popoverContainer.appendChild(popoverButton);

        popoverButton.addEventListener('click', () => {
            this.callbackList.push({fn: clickFn, param: null, el: popoverButton});
            this.submit();
        })
    }

    /**
     * Creates and adds a label to the popover.
     * @param {string|Function} textValue - Static text or function that returns dynamic text.
     */
    createAndAddLabel(textValue) {
        const popoverLabel = document.createElement('div');
        popoverLabel.classList.add('popoverItem', 'popoverLabel');

        let getValue;
        if (typeof textValue === 'function') {
            getValue = textValue;
            this.callbackList.push({fn: null, param: getValue, el: popoverLabel});
        } else {
            getValue = () => textValue;
        }

        popoverLabel.textContent = getValue();
        this.popoverContainer.appendChild(popoverLabel);
    }

    /**
     * Creates and adds an editable text input to the popover.
     * Submits on Enter key. Validates input against regex.
     * @param {string} initialText - Initial text content.
     * @param {Function} submitFn - Callback receiving the text content. Should return true if valid.
     * @param {RegExp} [regex=/<any pattern>/] - Regex pattern for allowed characters.
     */
    createAndAddTextInput(initialText, submitFn, regex = /[\s\S]*/) {
        const popoverTextInput = document.createElement('div');
        popoverTextInput.classList.add('popoverItem', 'popoverInput');
        popoverTextInput.textContent = initialText;
        popoverTextInput.contentEditable = 'true';
        popoverTextInput.spellcheck = false;
        this.popoverContainer.appendChild(popoverTextInput);

        // Move cursor to end of text
        const range = document.createRange();
        range.selectNodeContents(popoverTextInput);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        popoverTextInput.focus();

        let contents = popoverTextInput.textContent;
        this.callbackList.push({fn: submitFn, param: contents, el: popoverTextInput});

        popoverTextInput.addEventListener('keydown', (event) => {
            popoverTextInput.classList.remove('error');
            let key = event.key
            if (key === 'Enter'){
                event.preventDefault();
                contents = popoverTextInput.textContent;
                this.callbackList.forEach((element) => {
                    if (!element.el.classList.contains('popoverInput')) { return; }
                    element.param = element.el.textContent;
                })
                this.submit();
            }
            // Filter for non-character inputs, then apply regex
            if (key.length === 1){
                if (!(regex.test(key))){
                    event.preventDefault();
                }
            }
        })
    }

    /**
     * Creates and adds a horizontal divisor line to the popover.
     */
    createAndAddDivisor(){
        const popoverDivisor = document.createElement('div');
        popoverDivisor.classList.add('popoverItem', 'popoverDivisor');
        this.popoverContainer.appendChild(popoverDivisor);
    }

    /**
     * Submits all callback functions in the queue.
     * Removes the popover if all callbacks return true.
     * Shows error styling on items that return false.
     */
    submit(){
        const successful = []
        this.callbackList.forEach(({fn, param, el}) => {
          if (!fn(param)) {
            el.classList.add('error');
            successful.push(false);
          } else {
            el.classList.remove('error');
            successful.push(true);
          }
        })
        if (!successful.includes(false)) { this.remove(); }
    }

    /**
     * Finalizes the popover and adjusts its position to stay within viewport.
     * Must be called after all popover items are added.
     * Also returns focus to the target element.
     */
    endPopover(){
        const popoverEnd = document.createElement('div');
        popoverEnd.classList.add('popoverItem', 'end');
        this.popoverContainer.appendChild(popoverEnd);
        
        const rect = this.popoverContainer.getBoundingClientRect();
        const margin = 10;
        
        // Reposition if popover extends beyond viewport bottom
        const top = (this.y) < (0 + margin);
        const left = (this.x) < (0 + margin);
        const right = (this.x + rect.width) > (window.innerWidth - margin);
        const bottom = (this.y + rect.height) > (window.innerHeight - margin);
        
        if (bottom){
            this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y - rect.height}px)`;
        } else {
            this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;
        };

        this.target.focus({focusVisible: true});
    }

    /**
     * Redraws the popover at a new position and updates dynamic labels.
     * @param {Object} pos - New position.
     * @param {number} pos.x - X coordinate in pixels.
     * @param {number} pos.y - Y coordinate in pixels.
     */
    draw(pos = {x: 0, y: 0}){
        this.x = pos.x;
        this.y = pos.y;
        const rect = this.popoverContainer.getBoundingClientRect();
        const margin = 10;
        
        const top = (this.y) < (0 + margin);
        const left = (this.x) < (0 + margin);
        const right = (this.x + rect.width) > (window.innerWidth - margin);
        const bottom = (this.y + rect.height) > (window.innerHeight - margin);
        
        if (bottom){
            this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y - rect.height}px)`;
        } else {
            this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;
        };

        // Update dynamic labels
        this.callbackList.forEach(({fn, param, el}) => {
          if (el.classList.contains('popoverLabel')) {
            el.textContent = typeof param === 'function' ? param() : param;
          }
        });
    }

    /**
     * Removes the popover from the DOM and cleans up event listeners.
     * Removes the 'focus' class from the target element.
     */
    remove(){
        this.target.classList.remove('focus');
        this.popoverContainer.remove();
        document.removeEventListener('mousedown', this.clickHandler)
    }

}
