export class Popover {
    constructor(target = document.body, pos = {x: 0, y: 0}) {
        if (document.getElementsByClassName('popoverContainer').length){
            for (let element of document.getElementsByClassName('popoverContainer')){
                element.remove();
            }
        }
        this.target = target;
        this.target.classList.add('focus');
        this.popoverContainer = document.createElement('div');
        this.popoverContainer.classList.add('popoverContainer');
        document.body.appendChild(this.popoverContainer);

        this.x = pos.x;
        this.y = pos.y;

        this.popoverContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;

        this.callbackList = [];



        this.clickHandler = (_event) => {
            if (!this.popoverContainer.contains(_event.target)){
                _event.preventDefault();
                this.target.classList.remove('focus');
                this.popoverContainer.remove();
                document.removeEventListener('mousedown', this.clickHandler)
            }
        }

        setTimeout(()=>{
            document.addEventListener('mousedown', this.clickHandler)
        }, 0);


    }

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

    createAndAddLabel(textValue,) {
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

    createAndAddTextInput(initialText, submitFn, regex = /[\s\S]*/) {
        const popoverTextInput = document.createElement('div');
        popoverTextInput.classList.add('popoverItem', 'popoverInput');
        popoverTextInput.textContent = initialText;
        popoverTextInput.contentEditable = 'true';
        popoverTextInput.spellcheck = false;
        this.popoverContainer.appendChild(popoverTextInput);

        //moves cursor to end of text
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
            //filter for non-character inputs, then apply regex
            if (key.length === 1){
                if (!(regex.test(key))){
                    event.preventDefault();
                }
            }
        })
    }

    createAndAddDivisor(){
        const popoverDivisor = document.createElement('div');
        popoverDivisor.classList.add('popoverItem', 'popoverDivisor');
        this.popoverContainer.appendChild(popoverDivisor);
    }

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

    endPopover(){
        const popoverEnd = document.createElement('div');
        popoverEnd.classList.add('popoverItem', 'end');
        this.popoverContainer.appendChild(popoverEnd);
        const rect = this.popoverContainer.getBoundingClientRect();
        //10px margin
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

        this.target.focus({focusVisible: true});
    }

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
            this.popoverContainerContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;
        };

        this.callbackList.forEach(({fn, param, el}) => {
          if (el.classList.contains('popoverLabel')) {
            el.textContent = typeof param === 'function' ? param() : param;
          }
        });
    }

    remove(){
        this.target.classList.remove('focus');
        this.popoverContainer.remove();
        document.removeEventListener('mousedown', this.clickHandler)
    }

}
