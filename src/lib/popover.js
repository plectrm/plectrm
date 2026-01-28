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
     * Creates and adds an array input optimized for entering tunings or lists.
     * Each item is displayed in its own chip/box.
     * @param {string[]} initialArray - Initial array of strings.
     * @param {Function} submitFn - Callback receiving the array of strings. Should return true if valid.
     * @param {Object} [options] - Optional configuration.
     * @param {RegExp} [options.regex] - Regex pattern for allowed characters in each item.
     * @param {string} [options.delimiter=' '] - Key that triggers creating a new item.
     */
    createAndAddArrayInput(initialArray, submitFn, options = {}) {
        const { regex = /[\s\S]/, delimiter = ' ' } = options;

        const container = document.createElement('div');
        container.classList.add('popoverItem', 'popoverArrayInput');
        this.popoverContainer.appendChild(container);

        let items = initialArray.length > 0 ? [...initialArray] : [''];

        const getChipText = (chip) => chip.firstChild?.nodeValue || '';

        const render = () => {
            container.innerHTML = '';

            items.forEach((item, index) => {
                const chip = document.createElement('div');
                chip.classList.add('arrayInputChip');
                chip.contentEditable = 'true';
                chip.spellcheck = false;
                chip.appendChild(document.createTextNode(item));

                chip.addEventListener('input', () => {
                    items[index] = getChipText(chip);
                });

                chip.addEventListener('keydown', (event) => {
                    container.classList.remove('error');
                    const key = event.key;
                    const text = getChipText(chip);

                    if (key === 'Enter') {
                        event.preventDefault();
                        this.submit();
                        return;
                    }

                    if (key === delimiter) {
                        event.preventDefault();
                        items.splice(index + 1, 0, '');
                        render();
                        container.children[index + 1]?.focus();
                        return;
                    }

                    if (key === 'Backspace' && text === '' && items.length > 1) {
                        event.preventDefault();
                        items.splice(index, 1);
                        render();
                        const targetIndex = Math.max(0, index - 1);
                        container.children[targetIndex]?.focus();
                        return;
                    }

                    if (key === 'Delete' && text === '' && items.length > 1) {
                        event.preventDefault();
                        items.splice(index, 1);
                        render();
                        container.children[index]?.focus();
                        return;
                    }

                    if (key === 'ArrowRight' || key === 'ArrowLeft') {
                        const sel = window.getSelection();
                        if (!sel.rangeCount) return;
                        
                        const range = sel.getRangeAt(0);
                        const atEnd = range.endOffset >= text.length;
                        const atStart = range.startOffset === 0;

                        if (key === 'ArrowRight' && atEnd && index < items.length - 1) {
                            event.preventDefault();
                            container.children[index + 1]?.focus();
                        }
                        if (key === 'ArrowLeft' && atStart && index > 0) {
                            event.preventDefault();
                            container.children[index - 1]?.focus();
                        }
                        return;
                    }

                    if (key.length === 1 && !regex.test(key)) {
                        event.preventDefault();
                    }
                });

                container.appendChild(chip);
            });
        };

        render();

        this.callbackList.push({
            fn: () => {
                const result = [];
                const chips = container.querySelectorAll('.arrayInputChip:not(.arrayInputChipEmpty)');
                chips.forEach(chip => {
                    const text = getChipText(chip).trim();
                    if (text) result.push(text);
                });

                if (result.length === 0) {
                    container.classList.add('error');
                    return false;
                }

                container.classList.remove('error');
                return submitFn(result);
            },
            param: null,
            el: container
        });

        setTimeout(() => {
            container.querySelector('.arrayInputChip')?.focus();
        }, 0);
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
