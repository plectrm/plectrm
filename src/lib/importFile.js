export async function requestImportFile () {
    const response = await window.electronAPI.importFile();
    if (!response) { return console.log('Request to import file cancelled'); }
    
    if (response.extension === 'txt'){
        let buf = String(response.contents).split('\n');
        let initProject = [];
        let staveOptions = new StaveOptions();
        let textOptions = new TextOptions();
        buf.push("eof");
        for (let i = 0; i < buf.length; i++){

            // trimming whitespace from either end of line
            // if line only has control characters it should return as an empty string
            const line = buf.at(i).trim();
    
            if (line === "eof"){
                if (staveOptions.open){
                    initProject.push({el: 'stavebox', contents: staveOptions.getContents()})
                    staveOptions.reset();
                }
                if (textOptions.open){
                    initProject.push({el: 'textbox', contents: textOptions.getContents()})
                    textOptions.reset();
                }
            } else {
                if (/^(?=.*-)(?=.*\|)(?=.*[A-Za-z0-9]).+$/.test(line)){
                    // create stavebox

                    if (textOptions.open){
                        initProject.push({el: 'textbox', contents: textOptions.getContents()})
                        textOptions.reset();
                    }

                    staveOptions.open = true;

                    // check if it is articulation
                    // asuming syntax output by plectrm (one | at end of articulation)
                    const verticalBarsPresent = line.match(/\|/g).length;
                    if (verticalBarsPresent === 1){
                        staveOptions.staveArticulation = {contents: line}

                    } else if (verticalBarsPresent > 1){
                        // assuming first vertical bar is next to tuning
                        const idx = line.indexOf('|');
                        let tng = line.slice(0, idx).trim().replace(/[^a-z#]/gi, '');
                        if (tng.length){
                            staveOptions.tuning.unshift(tng);
                        };
        
                        // assuming second vertical bar is end of stave
                        const idx_2 = line.indexOf('|', idx + 1);
                        let stave = line.slice(idx + 1, idx_2);
                        if (stave.length){
                            const newline = stave.split("");
        
                            // handle if current line is longer than previous
                            if (newline.length > staveOptions.gridLength && Number.isFinite(staveOptions.gridLength)){
        
                                // add blank cells so all lines are the same length
                                staveOptions.cellArray.forEach((arr) => {
                                    const dif = Array.from({length: newline.length - arr.length}, () => '-');
                                    arr.push(...dif);
                                });
    
                                staveOptions.gridLength = newline.length;
                            }
    
                            // handle if current line is shorter than previous
                            if (newline.length < staveOptions.gridLength && Number.isFinite(staveOptions.gridLength)){
                                // add blank cells so line is the same length
                                const dif = Array.from({ length: staveOptions.gridLength - newline.length}, () => '-');
                                newline.push(...dif);
                            }
    
                            // on first successful line, set length to grid length
                            if (!Number.isFinite(staveOptions.gridLength)){
                                staveOptions.gridLength = newline.length;
                            }
                            
                            staveOptions.cellArray.push(newline);
                        }
                    } else {
                        // unexpected amount of vertical bars
                    }
                } else {
                    // create text box
                    if (staveOptions.open){
                        initProject.push({el: 'stavebox', contents: staveOptions.getContents()})
                        staveOptions.reset();
                    }

                    if (line !== ""){
                        if (textOptions.contents.length > 0){
                            textOptions.contents += `<div>${line}</div>`;
                        } else {
                            textOptions.contents += `${line}`;
                        }
                        textOptions.open = true;
                    } else if (textOptions.open){
                        initProject.push({el: 'textbox', contents: textOptions.getContents()})
                        textOptions.reset();
                    }
                }
            }
        }

        if (initProject.length){

            return initProject;
        } else {
            console.error('error parsing file contents: found nothing to import')
        }
    } else {
        console.error('importing cancelled: incorrect file type')
    }
}

function StaveOptions(){
    this.reset = () => {
        this.open = false;
        this.tuning = [];
        this.gridLength = null;
        this.cellArray = [];
        this.staveArticulation = false;
    }

    this.getContents = () => {

        // check to make sure stave box isnt missing cells        
        if (this.cellArray.flat().length < this.tuning.length * this.gridLength){
            let dif = Array.from({ length: (this.tuning.length * this.gridLength) - this.cellArray.flat().length}, () => '-');
            this.cellArray.push(dif);
        };
        
        // Convert 2D cellArray to format expected by new StaveBox constructor
        // Each cell needs: {idx, value}
        const clonedCellArray = this.cellArray.map((row, rowIdx) => 
            row.map((cell, colIdx) => ({
                idx: rowIdx * this.gridLength + colIdx,
                value: cell
            }))
        );

        const r = {
            tuning: this.tuning, 
            length: this.gridLength, 
            clonedCellArray: clonedCellArray, 
            articulation: this.staveArticulation
        };
        return r;
    }

    this.reset();
}

function TextOptions(){
    this.reset = () => {
        this.open = false;
        this.contents = "";
    }

    this.getContents = () => {
        return {contents: this.contents};
    }

    this.reset();
}