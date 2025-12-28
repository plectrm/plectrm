import { AddTextBoxButton, AddStaveBoxButton, AddNotationLegendButton } from "@/component/ribbon.js";
import { exportFile } from '@/lib/exportFile.js';

export class Workspace {
    
    constructor(_workspaceEl){
        this.ChildObjects = [];
        this.workspaceElement = _workspaceEl;
        this.emRect = null;

        const ribbon = document.getElementsByClassName('ribbonContainer').item(0);
        const exportButton = document.getElementsByClassName('exportButton').item(0);
        exportButton.innerHTML = window.electronAPI.getIcon('saveFile');

        AddTextBoxButton(ribbon, this);
        AddStaveBoxButton(ribbon, this);
        AddNotationLegendButton(ribbon, this);

        exportButton.onclick = () => {
            let textBuffer = ``;
            this.ChildObjects.forEach(element => {
                textBuffer += element.parseStringContents();
                textBuffer += `\n`;
            });
            exportFile(textBuffer);
        };

    };

    get el() {
        if (this.workspaceElement) { return this.workspaceElement; };
        const workspaceList = document.getElementsByClassName('workspaceContainer');
        if (workspaceList.length == 1) {
            this.workspaceElement = workspaceList.item(0)
            return this.workspaceElement;
        } else if (workspaceList.length > 1){
            console.warn('Workspace object missing element and cannot resolve it from document as there are multiple');
            return workspaceList.item(workspaceList.length - 1);
        };
    };

    get emSize() {
        if (!this.workspaceElement) return false;
        if (this.emRect) return this.emRect;
        const em = document.createElement('div');
        em.style.cssText = 'width:1em; height:1em; padding:0; margin:0;';
        this.el.appendChild(em);
        this.emRect = em.getBoundingClientRect();
        em.remove();
        return this.emRect;
    };
    
};
