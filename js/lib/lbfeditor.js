class LBFEditor {
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
               
        for(let i = 0; i < arguments.length; i++){
            if(typeof(arguments[i]) == "object"){
                Object.assign(this, arguments[i]);
            }
        }

        for (var key in this) {
            if (this.hasOwnProperty(key) && key == null) {
                throw new Error("Editor properties not set.");
            }
         }

         this.addKeyBindings();
    }

    run(){
        this.addKeyBindings();
    }

    beforeCompile(env){
        var settings        = {},
            cells           = null,
            i               = 0,
            rawCode         = '',
            compiledCode    = '',
            generatedF      = null,
            input           = [],
            output          = '';
        
        // Get the settings of the editor
        settings = LBFEditor.getEditorSettings(this);
        settings.environment     = env; //ENV_EDITOR;
        settings.surpress_errors = false;
        settings.debug           = false;
        settings.preproc         = true;
        
        var compiler = new LBFCompiler(settings);

        // Compile the raw code, then return the result
        rawCode = this.code.value;
        try {
            compiledCode = compiler.compile(rawCode);
        } catch (e) {
            // Show errors on top of the editor maybe ?
            console.log(e.name + ": " + e.message);
        }

        return compiledCode;
    }

    run(){
        var generatedF      = null,
            input           = [],
            output          = '';

        generatedF = new Function("n", this.beforeCompile(ENV_EDITOR));

        // Get input
        input = LBFEditor.parseInput(this);

        // Run generated Function
        output = generatedF(input);

        // Print output
        LBFEditor.output(this, output);
    }

    compile(){
        var jsCode = '';
        jsCode = this.beforeCompile(ENV_NATIVE);

        this.compiled_code_out.value = jsCode;

        $("#js-compiled-code").modal('toggle');
    }

    debug(){
        var rawCode     = '',
            rawHtml     = '',
            indexChar   = 0,
            memoryHtml  = '';

        this.step_button.disabled = false;
        this.step_out_button.disabled = false;        
        this.stop_button.disabled = false;

        // Start debugging
        this.db = new BFDebug(this);
        this.db.compileAndPreRun();

        // hide disabled debug message
        document.getElementById("editor-debug-code-disabled").style.display = "none";
        document.getElementById("debug-tab-button").dispatchEvent(new Event('click'));

        // dump memory in memory visualizer
        for(let m in this.db.machineState.memory){
            memoryHtml += "<span class=\"memory-cell-" + m.toString() + "\">";
            // memoryHtml += this.db.machineState.memory[m].toString();
            memoryHtml += LBFUtils.toHex(this.db.machineState.memory[m]);
 
            memoryHtml += "</span>";
            console.log(m);
            if(m == 256) break;
        }

        this.memory_dump.innerHTML = memoryHtml;

        rawCode = this.code.value;
        indexChar  = 0;
        for(let char of rawCode){
            if(char == "\n"){
                rawHtml += "<br>";
                continue;
            }
            if(/[\<\>\+\-\.\,\[\]\#]/g.test(char)){
                rawHtml += "<span class=\"debug-char-" + indexChar.toString();
                if(indexChar == this.db.machineState.instruction_pointer){
                    rawHtml += " next-instruction";
                }
                rawHtml += "\">";
                rawHtml += char;
                rawHtml += "</span>";
                indexChar++;
                continue;
            }
            //rawHtml += char;
        }

        if(this.db.machineState.no_breakpoint){
            this.step_button.disabled = true;
            this.step_out_button.disabled = true;
            this.stopDebug();
        }

        this.debug_code.innerHTML = rawHtml;
    }

    step(){
        var ms;

        var nextInstruction = document.getElementsByClassName("next-instruction")[0];

        // step
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

    }

    stepOutOfLoop(){
        do {
            this.step();
        } while(this.db.openedLoops.length);
    }

    stopDebug(){
        this.step_button.disabled = true;
        this.step_out_button.disabled = true;
        this.stop_button.disabled = true;
    }

    resetDebug(){
        this.step_button.disabled = true;
        this.step_out_button.disabled = true;        
        this.stop_button.disabled = true;

        document.getElementById("editor-debug-code").innerHTML = "";        
        document.getElementById("editor-debug-code-disabled").style.display = "flex";
        document.getElementById("editor-tab-button").dispatchEvent(new Event('click'));
    }

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

    static output(t, o){
        t.output.value = o;
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