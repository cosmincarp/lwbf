
        const CELL_8_BIT                    = 8;
        const CELL_16_BIT                   = 16;
        const CELL_32_BIT                   = 32;
        const DEFAULT_MEMORY_SIZE           = 32000; //32.000 cells
        const DEFAULT_STACK_SIZE            = 256; // 256
        const ENV_DEBUG                     = 1;
        const ENV_NATIVE                    = 2;
        const COMP_ERR_LOOP_NOT_CLOSED      = 0;
        const COMP_ERR_LOOP_NOT_OPENED      = 1;
        const COMP_ERR_ENV_UNKNOWN          = 2;


        var defaultCompilerSettings = {
            cell_size       : CELL_8_BIT,
            memory_size     : DEFAULT_MEMORY_SIZE,
            stack_size      : DEFAULT_STACK_SIZE,
            environment     : ENV_DEBUG,
            debug           : false,
            optimize        : true,
            surpress_errors : false
        }
        /*
            Compiler settings:
                cell_size: CELL_8_BIT / CELL_16_BIT / CELL_32_BIT
                memory_size: uint64
                stack_size: uint64
                environment: native / local
                debug: true / false;
        */

        class BFCompiler {
            constructor(){

            }

            // static compile(code, settings = defaultCompilerSettings){
            static compile(code, settings = defaultCompilerSettings){

                var cellSize        = settings['cell_size'];
                var memorySize      = settings['memory_size'];
                var environment     = settings['environment'];
                var debug           = settings['debug'];
                var optimize        = settings['optimize'];
                var surpressErrors  = settings['surpress_errors'];

                if(settings == null) console.log

                let compiledCode = '';
                let loopLevel = 0;
                let openedLoops = [];

                compiledCode += "var m=new Uint" + cellSize.toString() + "Array(" + memorySize.toString() + ");";
                compiledCode += "var i=0;";

                for(var ip = 0; ip < code.length; ip++){
                    switch (code[ip]) {

                        case '+':
                            if(optimize && code[ip+1] == '+'){
                                for(var lookAhead = 1; code[ip + lookAhead] == '+'; lookAhead++ );
                                compiledCode += "m[i]+=" + lookAhead.toString() + ";";
                                ip += lookAhead-1;
                            } else {
                                compiledCode += "m[i]++;";
                            }
                            break;

                        case '-':
                            if(optimize && code[ip+1] == '-'){
                                for(var lookAhead = 1; code[ip + lookAhead] == '-'; lookAhead++ );
                                compiledCode += "m[i]-=" + lookAhead.toString() + ";";
                                ip += lookAhead-1;
                            } else {
                                compiledCode += "m[i]--;";
                            }
                            break;

                        case '>':
                            if(optimize && code[ip+1] == '>'){
                                for(var lookAhead = 1; code[ip + lookAhead] == '>'; lookAhead++ );
                                compiledCode += "i+=" + lookAhead.toString() + ";";
                                ip += lookAhead-1;
                            } else {
                                compiledCode += "i++;";
                            }
                            break;

                        case '<':
                            if(optimize && code[ip+1] == '<'){
                                for(var lookAhead = 1; code[ip + lookAhead] == '<'; lookAhead++ );
                                compiledCode += "i-=" + lookAhead.toString() + ";";
                                ip += lookAhead-1;
                            } else {
                                compiledCode += "i--;";
                            }
                            break;

                        case '[':
                            compiledCode += "do{";
                            openedLoops.push(ip);
                            loopLevel++;
                            break;

                        case ']':
                            if(loopLevel == 0){
                                BFCompiler.compilerError(COMP_ERR_LOOP_NOT_OPENED, ip);
                                return false;
                            }
                            openedLoops.pop();
                            compiledCode += "}while(m[i]);";
                            loopLevel--;
                            break;

                        case '.':
                            switch (environment) {

                                case ENV_DEBUG:
                                    compiledCode += "BFDebug.printOutput(String.fromCharCode(m[i]));";
                                    break;

                                case ENV_NATIVE:
                                    compiledCode += "console.log(String.fromCharCode(m[i]));";
                                    break;

                                default:
                                    BFCompiler.compilerError(COMP_ERR_ENV_UNKNOWN);
                                    break;
                            }
                            break;

                        case ',':

                            break;

                        case '#':
                            if(debug){
                                if(loopLevel){
                                    for(let i = 0; i < loopLevel; i++){
                                        compiledCode += "}while(0);";
                                    }
                                }
                                compiledCode += "return {memory: m, instruction_pointer: i};";
                                return compiledCode;
                            }
                            break;

                        default:
                            break;
                    }
                }

                if(loopLevel != 0){
                    BFCompiler.compilerError(COMP_ERR_LOOP_NOT_CLOSED, ip, openedLoops);
                    return false;
                }

                // end of code, no # symbol found

                // if(debug){
                //     compiledCode += "return {memory: m, instruction_pointer: i};";
                // }
                // return compiledCode;

            }

            static compilerError(errCode, col, openedLoops){
                switch (errCode) {

                    case COMP_ERR_LOOP_NOT_CLOSED:
                        var forgottenLoops = openedLoops[0].toString();
                        for(let i = 1; i < openedLoops.length; i++){
                            forgottenLoops += ", " + openedLoops[i].toString();
                        }
                        console.error("Compile error: Loop(s) not closed at column(s): " + forgottenLoops);
                        break;

                    case COMP_ERR_LOOP_NOT_OPENED:
                        console.error("Compile error: Loop not opened at column " + col.toString());
                        break;

                    case COMP_ERR_ENV_UNKNOWN:
                        break;

                    default:
                        console.error("Something went wrong. :(");
                }
            }
        }

        class BFDebug {

            static printOutput(s){
                document.getElementById('output').value += s;
            }

            static resetOutput(){
                document.getElementById('output').value = '';
            }

        }

        // var opt = {
        //     cell_size: CELL_8_BIT,
        //     memory_size: DEFAULT_MEMORY_SIZE,
        //     //stack_size: 10,
        //     environment: ENV_NATIVE,
        //     debug: false,
        //     optimize: true
        // };


        function compileAndRun(){
            BFDebug.resetOutput();
            eval(BFCompiler.compile(document.getElementById('code').value));

        }
