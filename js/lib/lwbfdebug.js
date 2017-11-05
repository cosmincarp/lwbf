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

     compileAndPreRun(){
        var debugCode   = '',
            input       = '',
            settings    = {},
            generatedF  = null;

        // Construct compiler settings
        settings = LWBFEditor.getEditorSettings(this.editor);
        settings.environment     = ENV_DEBUG; //ENV_EDITOR;
        settings.debug           = true;
        settings.preproc         = false;

        // Compile
        this.rawCode = this.editor.code.value;
        var compiler = new LWBFCompiler(settings);
        try {
            debugCode = compiler.compile(this.rawCode);
        } catch (e) {
            console.log(e.name + ": " + e.message);
        }

        generatedF = new Function("n", debugCode);

        // Get input
        this.input = LWBFEditor.parseInput(this.editor);

        // Run code
        this.machineState = generatedF(this.input);

        LWBFEditor.output(this.editor, this.machineState.output);

        // return this.machineState;
    }

    step(){
        var ip, dp;

        ip = this.machineState.instruction_pointer;
        dp = this.machineState.data_pointer;

        if(ip < this.rawCode.length){
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
                        this.openedLoops.push(ip);
                    }
                    else {
                        while(this.rawCode[ip] != ']') {
                            ip++;
                        }
                    }
                    break;

                case ']':
                    if(this.machineState.memory[dp]){
                        ip = this.openedLoops[this.openedLoops.length-1];
                    } else {
                        this.openedLoops.pop();
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
            }
            ip++;
        } else {
            this.machineState.end_reached = true;
            return this.machineState;
        }

        this.machineState.instruction_pointer =ip;
        this.machineState.data_pointer = dp;

        return this.machineState;

    }

    startDebug(){
        this.compileAndPreRun();

        var html = '';
        var c = this.editor.code.value;
        var i = 0;
        var i_char = 0;
        for(var i = 0; i < c.length; i++){
            if(c[i] == '\n'){
                html += "<br>"
                continue;
            }
            if(/[\<\>\+\-\.\,\[\]]/g.test(c[i]) ){
                html += "<span class=\"code-char-" + i_char.toString() + "\">";
                html += c[i];
                html += "</span>";
                i_char++;
                continue;
            }
            html += c[i]
        }
        $("#editor-debug-code").html(html);
    }

    static printOutput(s){
        document.getElementById('output').value += s;
    }

    static resetOutput(){
        document.getElementById('output').value = '';
    }

}
