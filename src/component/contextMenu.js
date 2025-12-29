import { TransientInput } from "@/lib/transientInput.js";

export class ContextMenu {
    constructor(parentObject, workspace) {
        const parentContainer = parentObject.getRootContainer();
        const contextMenu = document.createElement('div');
        contextMenu.classList.add('contextMenu');
        const dragButton = document.createElement('div');
        dragButton.classList.add('dragHandle');
        dragButton.innerHTML = window.electronAPI.getIcon('dragHandle');
        contextMenu.appendChild(dragButton);
        const deleteButton = document.createElement('div');
        deleteButton.classList.add('deleteButton');
        deleteButton.innerHTML = window.electronAPI.getIcon('trash');
        contextMenu.appendChild(deleteButton);
        let elementCenterY;
        let previousElement = parentContainer.previousElementSibling;
        let previousElementRect;
        let nextElement = parentContainer.nextElementSibling;
        let nextElementRect;
        let yOffset = 0;
        deleteButton.clickAcc = 0;

        const resizeHandler = (entry) => {
            //calculates the approximate height of the parent object in ems
            const containerContentDiv = parentContainer.children[1]; //div of the container's content (textBox or staveBox)
            const computedEm = parseFloat(getComputedStyle(parentContainer).fontSize)
            const approxHeight = parseFloat(getComputedStyle(containerContentDiv).height) / computedEm;
            if (approxHeight < 2){
                deleteButton.classList.remove('show');
            } else {
                deleteButton.classList.add('show');
            }

            //resizeObserver should look at parentContainers content for correct height
            //content menu is rendered before the content so we need to switch resizeObservers
            //target when DOM is fully loaded
            if (entry[0].target === parentContainer){

                resizeObserver.unobserve(parentContainer);
                resizeObserver.observe(containerContentDiv);
            }
        }

        const resizeObserver = new ResizeObserver(resizeHandler)

        resizeObserver.observe(parentContainer);

        const elementDragging = (event) => {
            const mouseY = event.clientY;
            const elementRect = parentContainer.getBoundingClientRect();
            let distanceY = mouseY - elementCenterY;
            parentContainer.style.transform = `translateY(${distanceY + yOffset}px) scale(102%)`


            //dragging up
            if (previousElement){
                if (elementRect.top < (previousElementRect.top + (previousElementRect.height / 2))){
                    yOffset += previousElementRect.height + (workspace.emSize.height);
                    parentContainer.style.transform = `translateY(${distanceY + yOffset}px) scale(102%)`;

                    if (previousElement){previousElement.classList.toggle('glowBelow', false)};
                    if (nextElement){nextElement.classList.toggle('glowAbove', false)};

                    parentObject.decPositionInWorkspace();
                    workspace.el.insertBefore(parentContainer, previousElement);

                    //because inserting copies the object, css logic for displaying :active doesnt work
                    //so here I force it with a class and remove the class on mouseup
                    dragButton.classList.add('forceActive');

                    previousElement = parentContainer.previousElementSibling;
                    nextElement = parentContainer.nextElementSibling;

                    if (previousElement){
                        previousElementRect = previousElement.getBoundingClientRect();
                        previousElement.classList.toggle('glowBelow', true);
                    };
                    if (nextElement){
                        nextElementRect = nextElement.getBoundingClientRect();
                        nextElement.classList.toggle('glowAbove', true);
                    };
                }
            }

            //dragging down
            if (nextElement){
                if (elementRect.bottom > (nextElementRect.bottom - (nextElementRect.height/2))){
                    yOffset -= nextElementRect.height + (workspace.emSize.height);
                    parentContainer.style.transform = `translateY(${distanceY + yOffset}px) scale(102%)`;

                    if (previousElement){previousElement.classList.toggle('glowBelow', false)};
                    if (nextElement){nextElement.classList.toggle('glowAbove', false)};

                    parentObject.incPositionInWorkspace();
                    nextElement.insertAdjacentElement('afterend', parentContainer);


                    dragButton.classList.add('forceActive');

                    previousElement = parentContainer.previousElementSibling;
                    nextElement = parentContainer.nextElementSibling;

                    if (previousElement){
                        previousElementRect = previousElement.getBoundingClientRect();
                        previousElement.classList.toggle('glowBelow', true);
                    };
                    if (nextElement){
                        nextElementRect = nextElement.getBoundingClientRect();
                        nextElement.classList.toggle('glowAbove', true);
                    };
                }
            }

        }

        dragButton.addEventListener('mousedown', (event) => {
            if (event.button == 2){
                //get parent object's context menu options
                const parentFuncs = parentObject.contextMenuOptions;

                //open expanded context menu on right click
                const popUpContextMenu = new TransientInput(dragButton, {x: event.pageX,y: event.pageY});
                popUpContextMenu.createAndAddLabel(parentObject.getObjectNameAsString());
                popUpContextMenu.createAndAddDivisor();
                //add parent's menu options
                for (let i = 0; i < parentFuncs.length; i++){
                    popUpContextMenu.createAndAddButton(parentFuncs[i].label, ()=>{
                        const f = parentFuncs[i].func.bind(parentObject);
                        f();
                        return true;
                    })
                }
                
                popUpContextMenu.endTransientInput();


            } else {
                //drag element
                document.body.style.cursor = 'grabbing';
                const elementRect = dragButton.getBoundingClientRect();
                elementCenterY = elementRect.top + (elementRect.height / 2);
                parentContainer.classList.add('dragged');
                parentContainer.style.transform = `scale(102%)`;
                if(parentContainer.classList.contains('stave')) { parentObject.closeHoverMenu() };

                previousElement = parentContainer.previousElementSibling;
                nextElement = parentContainer.nextElementSibling;

                if (previousElement){previousElement.classList.toggle('glowBelow', true)};
                if (nextElement){nextElement.classList.toggle('glowAbove', true)};

                if (previousElement){previousElementRect = previousElement.getBoundingClientRect()};
                if (nextElement){nextElementRect = nextElement.getBoundingClientRect()};


                document.addEventListener('mousemove', elementDragging);

                document.addEventListener('mouseup', (event) => {
                    dragButton.classList.toggle('forceActive', false)
                    document.body.style.cursor = 'auto';
                    parentContainer.style.transform = `translateY(0px) scale(100%)`;
                    yOffset = 0;
                    parentContainer.classList.remove('dragged');
                    if (parentContainer.contains(event.target) && parentContainer.classList.contains('stave')) { parentObject.openHoverMenu(); }

                    previousElement = parentContainer.previousElementSibling;
                    nextElement = parentContainer.nextElementSibling;

                    if (previousElement){previousElement.classList.toggle('glowBelow', false)};
                    if (nextElement){nextElement.classList.toggle('glowAbove', false)};

                    document.removeEventListener('mousemove', elementDragging);
                })

            }
        })

        deleteButton.addEventListener('mousedown', (event) => {
            deleteButton.clickAcc += 1;
            if (deleteButton.clickAcc === 1){
                deleteButton.classList.add('confirmDelete');
            }
            if (deleteButton.clickAcc === 2){
                parentObject.remove();
            }
        })

        deleteButton.addEventListener('mouseleave', () => {
            if (deleteButton.clickAcc){
                deleteButton.clickAcc = 0;
                deleteButton.classList.remove('confirmDelete');
            }

        })

        return contextMenu;
    }
}
