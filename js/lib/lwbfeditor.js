class LWBFEditor {
    /*  Editor Object
     *  code
     *  run_button
     *  compile_button
     *  debug_button
     *  input
     *  output
     *  memory
     *  cell_size
     *  optimize
     *  compiled_code_out
     *  debug_code
     */

    constructor(/* settings */){
        this.code               = null;
        this.run_button         = null;
        this.compile_button     = null;
        this.debug_button       = null;
        this.input              = null;
        this.output             = null;
        this.memory             = null;
        this.cell_size          = null;
        this.optimize           = null;
        this.compiled_code_out  = null;
        this.debug_code         = null;
        this.step_button        = null; 
        this.step_out_button    = null; 
        this.stop_button        = null; 
        this.reset_button       = null;
        this.memory_dump        = null;

        //  Copy argments and overwrite settings
        for(let i = 0; i < arguments.length; i++){
            if(typeof(arguments[i]) == "object"){
                Object.assign(this, arguments[i]);
            }
        }
        
        //  Found a setting set to null? Not good. Throw error.
        for (var key in this) {
            if (this.hasOwnProperty(key) && key == null) {
                throw new Error("Editor properties not set.");
            }
         }

         // Set up all the event listeners
         this.addKeyBindings();
    }


    // run(){
    //     this.addKeyBindings();
    // }

    //  Before compile function
    //  @desc   Set up the settings, pass them to the LWBFCompiler and compile the existing code.
    //  @arg    env     Environment in which this function is called
    //  @return compiledCode
    beforeCompile(env){
        var settings        = {},
            cells           = null,
            i               = 0,
            rawCode         = '',
            compiledCode    = '',
            generatedF      = null,
            input           = [],
            output          = '';
        //  Get all the volatile settings of the editor (settings which can be modified at runtime),
        //  and set some default and internal settings
        settings = LWBFEditor.getEditorSettings(this);
        settings.environment     = env; //ENV_EDITOR;
        settings.surpress_errors = false;
        settings.debug           = false;
        settings.preproc         = true;
        
        // Compile the raw code, get the result
        var compiler = new LWBFCompiler(settings);
        rawCode = this.code.value;
        try {
            compiledCode = compiler.compile(rawCode);
        } catch (e) {
            // Show errors on top of the editor maybe ?
            console.log(e.name + ": " + e.message);
        }

        return compiledCode;
    }

    //  Run function
    //  @desc   Transpile the code from the editor to JS, run it and print out the result
    run(){
        var generatedF      = null,
            input           = [],
            output          = '';

        generatedF = new Function("n", this.beforeCompile(ENV_EDITOR));

        //  Get input (read with `,`)
        input = LWBFEditor.parseInput(this);

        //  Run the transpiled code
        output = generatedF(input);

        //  Print output, if any
        LWBFEditor.output(this, output);
    }

    //  Compile function
    //  @desc   Transpile the code from the editor to JS, paste it into an modal box, and pop it up.
    compile(){
        var jsCode = '';
        jsCode = this.beforeCompile(ENV_NATIVE);

        this.compiled_code_out.value = jsCode;

        $("#js-compiled-code").modal('toggle');
    }

    //  Debug function
    //  @desc   Starts debugging, "renders" the code debugger screen.
    debug(){
        var rawCode     = '',
            rawHtml     = '',
            indexChar   = 0;

        this.step_button.disabled = false;
        this.step_out_button.disabled = false;        
        this.stop_button.disabled = false;

        //  Start debugging
        this.db = new LWBFDebug(this);
        this.db.compileAndPreRun();

        //  Hide "Press X to start debugging" message
        document.getElementById("editor-debug-code-disabled").style.display = "none";
        document.getElementById("debug-tab-button").dispatchEvent(new Event('click'));

        //  Dump the machine's memory
        this.dumpMemory(this.db.machineState.data_pointer);

        rawCode = this.code.value;
        indexChar  = 0;
        for(let char of rawCode){
            if(char == "\n") {
                rawHtml += "<br>";
            } else if(/[\<\>\+\-\.\,\[\]\#]/g.test(char)) {
                rawHtml += "<span class=\"debug-char-" + indexChar.toString();
                if(indexChar == this.db.machineState.instruction_pointer + 1) {
                    rawHtml += " next-instruction";
                }
                rawHtml += "\">";
                rawHtml += char;
                rawHtml += "</span>";
                indexChar++;
            } else {
                rawHtml += char;
            }
        }

        if(this.db.machineState.no_breakpoint){
            this.step_button.disabled = true;
            this.step_out_button.disabled = true;
            this.stopDebug();
        }

        this.debug_code.innerHTML = rawHtml;
    }

    //  Step function
    //  @desc   Step the program, mark the next instruction, make the necessary changes to the memory visualizer.
    step(){
        var ms;

        var nextInstruction = document.getElementsByClassName("next-instruction")[0];

        // Step the debugger
        ms = this.db.step();
        if(ms.end_reached) {
            this.stopDebug();
            return;
        }
        else {   
            nextInstruction.className = nextInstruction.className.replace(/\snext-instruction/, '');
            if(this.db.machineState.instruction_pointer < this.db.rawCode.length) {
                document.getElementsByClassName('debug-char-' + this.db.machineState.instruction_pointer)[0].className += " next-instruction";
            }
        }

        this.refreshMemory(ms.data_pointer);
    }

    //  Step out of loop function
    //  @desc   Steps the debugger until it exits the current while loop
    //TODO: Fix this v so it escapes the current loop, not all the nested loops
    stepOutOfLoop(){
        var nestedLoops = this.db.machineState.openedLoops.length;
        do {
            this.step();
        } while(nestedLoops - 1 == this.db.machineState.openedLoops.length || this.db.machineState.openedLoops.length != 0);
    }

    //  Stop debugger function
    //  @desc   Disable some buttons.
    stopDebug(){
        this.step_button.disabled = true;
        this.step_out_button.disabled = true;
        this.stop_button.disabled = true;
    }

    //  Reset debugger function
    //  @desc   Enable the buttons, clear the visualizer
    //TODO: FIX ^ clear the memory, too.
    resetDebug(){
        this.step_button.disabled = true;
        this.step_out_button.disabled = true;        
        this.stop_button.disabled = true;

        document.getElementById("editor-debug-code").innerHTML = "";        
        document.getElementById("editor-debug-code-disabled").style.display = "flex";
        document.getElementById("editor-tab-button").dispatchEvent(new Event('click'));
    }

    //  Parse Input
    //  @desc   Get the input string, and parse it 
    //  @arg    t   input string
    //  @return parsedInput
    //TODO: ADD support for characters ('a' => ASCII('a'))
    static parseInput(t){
        var input       = null,
            i           = 0,
            inputIndex  = 0,
            parsedInput = [];

        input = t.input.value.split(' ');
        for(i of input){
            if(/\d+/.test(i) && !(/\D+/.test(i))){
                parsedInput.push(Number(i));
            }
        }

        return parsedInput;
    }

    //  Output function
    //  @desc   Print out the output generated by the code
    //  @arg    t   - editor
    //  @arg    o   - output value
    static output(t, o){
        t.output.value = o;
    }

    //  Dump memory function
    //  @desc   Initial memory dump, generate the memory matrix / visualiser, and put a mark on the current
    //          selected cell
    //TODO: v Beautify this
    dumpMemory(data_p) {
        var memoryHtml  = '';
        for(let m in this.db.machineState.memory){
            memoryHtml += "<span class=\"memory-cell-" + m.toString();
            if(m == data_p)
                memoryHtml += " focused-cell";

            memoryHtml += "\">";
                
            // memoryHtml += this.db.machineState.memory[m].toString();
            memoryHtml += LBFUtils.toHex(this.db.machineState.memory[m]);
 
            memoryHtml += "</span>";
            if(m == 256) break;
        }

        this.memory_dump.innerHTML = memoryHtml;
    }

    refreshMemory(data_p){
        document.getElementsByClassName("focused-cell")[0].classList.remove("focused-cell");
        document.getElementsByClassName("memory-cell-" + data_p.toString())[0].classList.add("focused-cell");

        document.getElementsByClassName("focused-cell")[0].innerHTML = LBFUtils.toHex(this.db.machineState.memory[data_p]);
        
    }

    addKeyBindings(){
        var contextual_this = this;

        this.run_button.addEventListener('click', function(e){
            // Run code ...
            contextual_this.run();
        });

        this.compile_button.addEventListener('click', function(e){
            // Compile code ...
            contextual_this.compile();
        });

        this.debug_button.addEventListener('click', function(e){
            // Debug code ...
            contextual_this.debug();
        });

        this.step_button.addEventListener('click', function(e){
            // Debug code ...
            contextual_this.step();
        });

        this.step_out_button.addEventListener('click', function(e){
            // Debug code ...
            contextual_this.stepOutOfLoop();
        });

        this.stop_button.addEventListener('click', function(e){
            // Debug code ...
            contextual_this.stopDebug();
        });

        this.reset_button.addEventListener('click', function(e){
            contextual_this.resetDebug();
        });

        // key bindings
        document.addEventListener("keyup", function(e){
            if(e.altKey && e.shiftKey && e.code == "KeyR"){
                contextual_this.run();
            }
        });

        document.addEventListener("keyup", function(e){
            if(e.altKey && e.shiftKey && e.code == "KeyD"){
                contextual_this.debug();
            }
        });

        document.addEventListener("keyup", function(e){
            if(e.altKey && e.shiftKey && e.code == "KeyC"){
                contextual_this.compile();
            }
        });
    }

    static getEditorSettings(e){
        var cells,
            settings = {};

        cells = e.cell_size.getElementsByTagName('input');
        for(var i = 0; i < cells.length; i++){
            if($(cells[i]).is(':checked')){
                settings.cell_size = Number(cells[i].name);
            }
        }

        settings.memory_size     = e.memory.value;
        settings.optimize        = e.optimize.checked;
        return settings;
    }

}