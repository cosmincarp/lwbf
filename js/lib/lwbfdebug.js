class LWBFDebug {
    /*
        Machine State Object (MSO)
        memory: uint array;
        data_pointer: uint;
        instruction_pointer: uint;
        output: string;
        input: array;
        input_pointer: uint;
        is_complete: boolean
    */

    constructor(editor){
        this.editor = editor;
        this.machineState = {};
        this.openedLoops = [];
    }

    //TODO: FIX the loop debugging - if the breakpoint is inside a loop, it will transpile the code
    //TODO: until that BP is hit, but it *DOES NOT* save and carry on in the debug stage information
    //TODO: about loop nesting at the breakpoint.
    //  Compile and pre-run function
    //  @desc   "Compile" to JS all the code with the debug setting set to true, execute the
    //          generated code, set the machine state and halt.
     compileAndPreRun(){
        var debugCode   = '',
            input       = '',
            settings    = {},
            generatedF  = null;

        // Set up compiler settings
        settings                 = LWBFEditor.getEditorSettings(this.editor);
        settings.environment     = ENV_DEBUG; //ENV_EDITOR;
        settings.debug           = true;
        settings.preproc         = false;

        // Generate the code
        this.rawCode = this.editor.code.value;
        var compiler = new LWBFCompiler(settings);
        try {
            debugCode = compiler.compile(this.rawCode);
        } catch (e) {
            console.log(e.name + ": " + e.message);
        }
        generatedF = new Function("n", debugCode.compiledCode);

        // Get input
        this.input = LWBFEditor.parseInput(this.editor);

        // Run code, store the machineState
        this.machineState = generatedF(this.input);
        this.machineState.openedLoops = debugCode.openedLoops;
        // Output what is needed.
        LWBFEditor.output(this.editor, this.machineState.output);

        // return this.machineState;
    }

    //  Step function
    //  @desc   A symbol-by-symbol interpreter that executes the next instruction and halts.
    //  @return machineState    Object which contains the state of the machine (memory, ip, dp)
    step(){
        var ip, dp;

        ip = this.machineState.instruction_pointer;
        dp = this.machineState.data_pointer;

        if(ip < this.rawCode.length){

            //  Find the next legal character
            while(/[^\<\>\+\-\.\,\[\]]/g.test(this.rawCode[ip]) && ip < this.rawCode.length) ip++;

            switch (this.rawCode[ip]) {
                case '+':
                    this.machineState.memory[dp]++;
                    break;

                case '-':
                    this.machineState.memory[dp]--;
                    break;

                case '>':
                    dp++;
                    break;

                case '<':
                    dp--;
                    break;

                case '[':
                    if(this.machineState.memory[dp]) {
                        // this.openedLoops.push(ip);
                        this.machineState.openedLoops.push(ip);
                    }
                    else {
                        while(this.rawCode[ip] != ']') {
                            ip++;
                        }
                    }
                    break;

                case ']':
                    if(this.machineState.memory[dp]){
                        ip = this.machineState.openedLoops[this.machineState.openedLoops.length-1];
                    } else {
                        // this.openedLoops.pop();
                        this.machineState.openedLoops.pop();
                    }
                    break;

                case '.':
                    this.machineState.output += String.fromCharCode(this.machineState.memory[dp]);
                    break;

                case ',':
                    this.machineState.memory[dp] = this.machineState.input[this.machineState.input_pointer];
                    this.machineState.input_pointer++;
                    break;

                default:
                    break;
            }
            ip++;
        } else {
            this.machineState.end_reached = true;
            // return this.machineState;   // not needed
        }

        this.machineState.instruction_pointer =ip;
        this.machineState.data_pointer = dp;

        return this.machineState;
    }

    // ! UNUSED
    startDebug(){

        this.compileAndPreRun();

        var html = '';
        var c = this.editor.code.value;

        for(var i = 0, i_char = 0; i < c.length; ++i) {
            if(c[i] == '\n') {
                html += "<br>";
            }
            else if( /[\<\>\+\-\.\,\[\]]/g.test(c[i]) ) {
                html += "<span class=\"code-char-" + i_char.toString() + "\">";
                html += c[i];
                html += "</span>";
                ++i_char;
            } else {
                html += c[i];
            }
        }
        this.editor.debug_code.innerHTML = html;
    }

    static printOutput(s){
        document.getElementById('output').value += s;
    }

    static resetOutput(){
        document.getElementById('output').value = '';
    }

}
