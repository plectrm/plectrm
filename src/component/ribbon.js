import { TextBox } from "@/component/textBox.js";
import { StaveBox } from "@/component/staveBox.js";
import { NotationLegend } from "@/component/notationLegend.js";
import { Popover } from "@/lib/popover.js";

export function AddTextBoxButton(ribbon, workspace) {
    const button = {
        el: {}
    };
    
    button.el.button = document.createElement('button');
    button.el.button.classList.add('ribbonButton');
    button.el.button.innerHTML = window.electronAPI.getIcon('addText');
    button.el.button.title = "Add TextBox";
    button.el.button.onclick = function(){
        workspace.ChildObjects.push(new TextBox(workspace))
    };
    ribbon.appendChild(button.el.button);
    
    return button;
}

export function AddStaveBoxButton(ribbon, workspace) {
    const button = {
        el: {},
        options: { size: 24, tuning: 'E/A/D/G/B/e/' }
    };
    
    button.el.container = document.createElement('div');
    button.el.container.classList.add('ribbonSplitDropdown');

    button.el.mainButton = document.createElement('button');
    button.el.mainButton.classList.add('ribbonSplitDropdownButton');
    button.el.mainButton.innerHTML = window.electronAPI.getIcon('addStave');
    button.el.mainButton.title = "Add StaveBox";
    button.el.mainButton.onclick = function(){
        const tuningArray = button.options.tuning.split('/').filter(Boolean);
        workspace.ChildObjects.push(new StaveBox(workspace, tuningArray, { length: button.options.size, clonedCellArray: [] }))
    };

    button.el.dropdownButton = document.createElement('button');
    button.el.dropdownButton.classList.add('ribbonSplitDropdownDropdown');
    button.el.dropdownButton.innerHTML = window.electronAPI.getIcon('collapse');
    button.el.dropdownButton.title = "StaveBox Options"
    button.el.dropdownButton.onclick = function(){
        const buttonRect = button.el.dropdownButton.getBoundingClientRect();
        const staveBoxOptionsMenu = new Popover(button.el.dropdownButton, {x: buttonRect.left, y: buttonRect.top});
        staveBoxOptionsMenu.createAndAddLabel('StaveBox settings');
        staveBoxOptionsMenu.createAndAddDivisor();
        staveBoxOptionsMenu.createAndAddLabel('tuning');
        const initialTuning = button.options.tuning.split('/').filter(Boolean);
        staveBoxOptionsMenu.createAndAddArrayInput(initialTuning, (newTuning) => {
          if (newTuning.length === 0) { return false; }
          button.options.tuning = newTuning.join('/');
          return true;
        }, {
          regex: /^[A-Za-z#b0-9]$/
        })
        staveBoxOptionsMenu.createAndAddLabel('size');
        staveBoxOptionsMenu.createAndAddTextInput(button.options.size, (contents) => {
          contents = parseInt(contents);
          console.log(contents)
          if (!Number.isFinite(contents)) { return false; }
          if (contents < 1 || contents > 70) { return false;  }
          button.options.size = contents;
          return true;
        }, /^(?:[0-9]|[1-9][0-8])$/);
        staveBoxOptionsMenu.endPopover();
    }
    button.el.container.appendChild(button.el.mainButton);
    button.el.container.appendChild(button.el.dropdownButton);
    ribbon.appendChild(button.el.container);
    
    return button;
}

export function AddNotationLegendButton(ribbon, workspace){
    const button = {
        el: {}
    };
    
    button.el.button = document.createElement('button');
    button.el.button.classList.add('ribbonButton');
    button.el.button.innerHTML = window.electronAPI.getIcon('addNotation');
    button.el.button.title = "Add Notation Legend";
    button.el.button.onclick = function(){
        workspace.ChildObjects.push(new NotationLegend(workspace))
    };
    ribbon.appendChild(button.el.button);
    
    return button;
}
