export class TransientInput {
    constructor(target = document.body, pos = {x: 0, y: 0}) {
        if (document.getElementsByClassName('transientInputContainer').length){
            for (let element of document.getElementsByClassName('transientInputContainer')){
                element.remove();
            }
        }
        this.target = target;
        this.target.classList.toggle('focus', true);
        this.transientInputContainer = document.createElement('div');
        this.transientInputContainer.classList.add('transientInputContainer');
        document.body.appendChild(this.transientInputContainer);

        this.x = pos.x;
        this.y = pos.y;

        this.transientInputContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;

        this.callbackList = [];



        this.clickHandler = (_event) => {
            if (!this.transientInputContainer.contains(_event.target)){
                _event.preventDefault();
                if (!this.target.contains(_event.target)) { this.target.classList.toggle('focus', false); };
                this.transientInputContainer.remove();
                document.removeEventListener('mousedown', this.clickHandler)
            }
        }

        setTimeout(()=>{
            document.addEventListener('mousedown', this.clickHandler)
        }, 0);


    }

    createAndAddButton(textLabel, clickFn) {
        const transientButton = document.createElement('div');
        transientButton.classList.add('transientItem', 'transientButton');
        transientButton.textContent = textLabel;
        this.transientInputContainer.appendChild(transientButton);

        transientButton.addEventListener('click', () => {
            this.callbackList.push({fn: clickFn, param: null, el: transientButton});
            this.submit();
        })
    }

    createAndAddLabel(textValue,) {
        const transientLabel = document.createElement('div');
        transientLabel.classList.add('transientItem', 'transientLabel');

        let getValue;
        if (typeof textValue === 'function') {
            getValue = textValue;
            this.callbackList.push({fn: null, param: getValue, el: transientLabel});
        } else {
            getValue = () => textValue;
        }

        transientLabel.textContent = getValue();
        this.transientInputContainer.appendChild(transientLabel);
    }

    createAndAddTextInput(initialText, submitFn, regex = /[\s\S]*/) {
        const transientTextInput = document.createElement('div');
        transientTextInput.classList.add('transientItem', 'transientInput');
        transientTextInput.textContent = initialText;
        transientTextInput.contentEditable = 'true';
        transientTextInput.spellcheck = false;
        this.transientInputContainer.appendChild(transientTextInput);

        //moves cursor to end of text
        const range = document.createRange();
        range.selectNodeContents(transientTextInput);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        transientTextInput.focus();

        let contents = transientTextInput.textContent;
        this.callbackList.push({fn: submitFn, param: contents, el: transientTextInput});

        transientTextInput.addEventListener('keydown', (event) => {
            transientTextInput.classList.toggle('error', false);
            let key = event.key
            if (key === 'Enter'){
                event.preventDefault();
                contents = transientTextInput.textContent;
                this.callbackList.forEach((element) => {
                    if (!element.el.classList.contains('transientInput')) { return; }
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
        const transientDivisor = document.createElement('div');
        transientDivisor.classList.add('transientItem', 'transientDivisor');
        this.transientInputContainer.appendChild(transientDivisor);
    }

    submit(){
        const successful = []
        this.callbackList.forEach(({fn, param, el}) => {
          if (!fn(param)) {
            el.classList.toggle('error', true);
            successful.push(false);
          } else {
            el.classList.toggle('error', false);
            successful.push(true);
          }
        })
        if (!successful.includes(false)) { this.remove(); }
    }

    endTransientInput(){
        const transientInputEnd = document.createElement('div');
        transientInputEnd.classList.add('transientItem', 'end');
        this.transientInputContainer.appendChild(transientInputEnd);
        const rect = this.transientInputContainer.getBoundingClientRect();
        //10px margin
        const margin = 10;
        const top = (this.y) < (0 + margin);
        const left = (this.x) < (0 + margin);
        const right = (this.x + rect.width) > (window.innerWidth - margin);
        const bottom = (this.y + rect.height) > (window.innerHeight - margin);
        if (bottom){
            this.transientInputContainer.style.transform = `translate(${this.x}px, ${this.y - rect.height}px)`;
        } else {
            this.transientInputContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;
        };

        this.target.focus({focusVisible: true});
    }

    draw(pos = {x: 0, y: 0}){
        this.x = pos.x;
        this.y = pos.y;
        const rect = this.transientInputContainer.getBoundingClientRect();
        const margin = 10;
        const top = (this.y) < (0 + margin);
        const left = (this.x) < (0 + margin);
        const right = (this.x + rect.width) > (window.innerWidth - margin);
        const bottom = (this.y + rect.height) > (window.innerHeight - margin);
        if (bottom){
            this.transientInputContainer.style.transform = `translate(${this.x}px, ${this.y - rect.height}px)`;
        } else {
            this.transientInputContainer.style.transform = `translate(${this.x}px, ${this.y}px)`;
        };

        this.callbackList.forEach(({fn, param, el}) => {
          if (el.classList.contains('transientLabel')) {
            el.textContent = typeof param === 'function' ? param() : param;
          }
        });
    }

    remove(){
        this.target.classList.toggle('focus', false);
        this.transientInputContainer.remove();
        document.removeEventListener('mousedown', this.clickHandler)
    }

}
