import { TextBox } from "@/component/textBox.js";
import { StaveBox } from "@/component/staveBox.js";
import { NotationLegend } from "@/component/notationLegend.js";
import { TransientInput } from "@/lib/transientInput.js";

export function AddTextBoxButton (_ribbon, workspace){
    const textBoxButton = document.createElement('button');
    textBoxButton.classList.add('ribbonButton');
    textBoxButton.innerHTML = window.electronAPI.getIcon('addText');
    textBoxButton.title = "Add TextBox";
    textBoxButton.onclick = function(){
        workspace.ChildObjects.push(new TextBox(workspace))
    };
    _ribbon.appendChild(textBoxButton);
}

export function AddStaveBoxButton(_ribbon, workspace){
    const staveBoxContainer = document.createElement('div');
    staveBoxContainer.classList.add('ribbonSplitDropdown');

    const staveBoxButton = document.createElement('button');
    staveBoxButton.classList.add('ribbonSplitDropdownButton');
    staveBoxButton.innerHTML = window.electronAPI.getIcon('addStave');
    staveBoxButton.title = "Add StaveBox";
    staveBoxButton.Options = {size: 24, tuning: 'E/A/D/G/B/e/'}
    staveBoxButton.onclick = function(){
        workspace.ChildObjects.push(new StaveBox(workspace, staveBoxButton.Options.size, staveBoxButton.Options.tuning))
    };

    const staveBoxDropdown = document.createElement('button');
    staveBoxDropdown.classList.add('ribbonSplitDropdownDropdown');
    staveBoxDropdown.innerHTML = window.electronAPI.getIcon('collapse');
    staveBoxDropdown.title = "StaveBox Options"
    staveBoxDropdown.onclick = function(){
        const buttonRect = staveBoxDropdown.getBoundingClientRect();
        const staveBoxOptionsMenu = new TransientInput(staveBoxDropdown, {x: buttonRect.left, y: buttonRect.top});
        staveBoxOptionsMenu.createAndAddLabel('StaveBox settings');
        staveBoxOptionsMenu.createAndAddDivisor();
        staveBoxOptionsMenu.createAndAddLabel('tuning');
        staveBoxOptionsMenu.createAndAddTextInput(staveBoxButton.Options.tuning, (contents) => {
          if (!contents.includes('/')) { return false; };
          contents = contents.trim();
          staveBoxButton.Options.tuning = contents;
          return true;
        }, /^[A-Za-z/# ]+$/)
        staveBoxOptionsMenu.createAndAddLabel('size');
        staveBoxOptionsMenu.createAndAddTextInput(staveBoxButton.Options.size, (contents) => {
          contents = parseInt(contents);
          if (!Number.isFinite(contents)) { return false; }
          if (contents < 1 || contents > 70) { return false;  }
          staveBoxButton.Options.size = contents;
          return true;
        }, /^(?:[0-9]|[1-9][0-8])$/);
        staveBoxOptionsMenu.endTransientInput();
    }
    staveBoxContainer.appendChild(staveBoxButton);
    staveBoxContainer.appendChild(staveBoxDropdown);
    _ribbon.appendChild(staveBoxContainer);
}

export function AddNotationLegendButton(_ribbon, workspace){
    const notationButton = document.createElement('button');
    notationButton.classList.add('ribbonButton');
    notationButton.innerHTML = window.electronAPI.getIcon('addNotation');
    notationButton.title = "Add Notation Legend";
    notationButton.onclick = function(){
        workspace.ChildObjects.push(new NotationLegend(workspace))
    };
    _ribbon.appendChild(notationButton);
}