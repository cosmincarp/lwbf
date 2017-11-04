/*
    Compiler Settings Object:
        cell_size: CELL_8_BIT / CELL_16_BIT / CELL_32_BIT
        memory_size: uint64
        environment: native / local
        debug: boolean;
        optimize: boolean;
        surpress_errors: boolean;
        preproc: boolean;
*/

//class BFCompiler {
    var BFCompiler = {
        compiler(code, settings = {}){
    
            var cellSize, memorySize, environment, debug, optimize, surpressErrors, preproc, compiledCode, loopLevel, openedLoops, ip;
    
            compiledCode = '';
            loopLevel = 0;
            openedLoops = [];
    
            // Check parameters
            if(typeof(code) != "string"){
                BFCompiler.compilerError(COMP_ERR_CODE_INPUT);
                return;
            }
            if(typeof(settings) == "undefined" || settings == null){
                BFCompiler.compilerError(COMP_ERR_SETTINGS);
                return;
            }
    
            // initialize settings
            cellSize        = (typeof(settings["cell_size"])        == "undefined") ? CELL_8_BIT            : settings['cell_size'];
            memorySize      = (typeof(settings["memory_size"])      == "undefined") ? DEFAULT_MEMORY_SIZE   : settings['memory_size'];
            environment     = (typeof(settings["environment"])      == "undefined") ? ENV_EDITOR            : settings['environment'];
            debug           = (typeof(settings["debug"])            == "undefined") ? false                 : settings['debug'];
            optimize        = (typeof(settings["optimize"])         == "undefined") ? true                  : settings['optimize'];
            surpressErrors  = (typeof(settings["surpress_errors"])  == "undefined") ? false                 : settings['surpress_errors'];
            preproc         = (typeof(settings["preprocessor"])     == "undefined") ? true                  : settings['preprocessor'];
    
            if(environment == ENV_NATIVE){
                compiledCode += "var n=[ /*INPUT*/ ];";
            }
            compiledCode += "var m=new Uint" + cellSize.toString() + "Array(" + memorySize.toString() + "),";
            compiledCode += "i=0,j=0,o=\'\',p=String.fromCharCode;";
    
            if(preproc){
                code = BFCompiler.preprocessor(code, debug);
            }
    
            for(ip = 0; ip < code.length; ip++){
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
                            case ENV_EDITOR:
                            case ENV_DEBUG:
                                // compiledCode += "BFDebug.printOutput(String.fromCharCode(m[i]));";
                                compiledCode += "o+=p(m[i]);";
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
                        compiledCode += "m[i]=n[j];j++;";
                        break;
                    case '#':
                        if(debug){
                            if(loopLevel){
                                for(let i = 0; i < loopLevel; i++){
                                    compiledCode += "}while(0);";
                                }
                            }
                            compiledCode += "return {memory: m, data_pointer: i, instruction_pointer: " + (ip+1).toString() +", output: o, input: n, input_pointer:j};";
                            return compiledCode;
                        }
                        break;
                    default:
                        // break;
                }
            }
    
            if(loopLevel != 0){
                BFCompiler.compilerError(COMP_ERR_LOOP_NOT_CLOSED, ip, openedLoops);
                return false;
            }
    
            if(debug){
                // End of code, no #
                compiledCode += "return {memory: m, data_pointer: i, output: o, input: n, input_pointer:j, no_breakpoint: true};";
            } else {
                if (environment == ENV_NATIVE) {
                    compiledCode += "console.log(o);"
                } else {
                    compiledCode += "return o;";
                }
            }
    
            return compiledCode;
    
        },
    
        preprocessor(code, debug){
            if(debug){
                return code.replace(/[^\<\>\+\-\.\,\[\]\#]/g, '');
            }
            return code.replace(/[^\<\>\+\-\.\,\[\]]/g, '');
        },
    
        compilerError(errCode, col, openedLoops){
            var err = new Error();
            err.name = "Compiler error";
    
            switch (errCode) {
                case COMP_ERR_LOOP_NOT_CLOSED:
                    var forgottenLoops = openedLoops[0].toString();
                    for(let i = 1; i < openedLoops.length; i++){
                        forgottenLoops += ", " + openedLoops[i].toString();
                    }
                    // console.error("Compile error: Loop(s) not closed at column(s): " + forgottenLoops);
                    err.message = "Loop(s) not closed at column(s): " + forgottenLoops;
                    break;
                case COMP_ERR_LOOP_NOT_OPENED:
                    // console.error("Compile error: Loop not opened at column " + col.toString());
                    err.message = "Loop not opened at column " + col.toString();
                    break;
                case COMP_ERR_ENV_UNKNOWN:
                    // console.error("Compile error: Unknown environment.");
                    err.message = "Unknown environment.";
                    break;
                case COMP_ERR_CODE_INPUT:
                    // console.error("Compile error: First argument of compiler() must be String.");
                    err.message = "First argument of compiler() must be String.";
                    break;
                case COMP_ERR_SETTINGS:
                    // console.error("Compile error: Second argument of compiler() is null or undefined.");
                    err.message = "Second argument of compiler() is null or undefined.";
                    break;
                default:
                    console.error("Something went wrong. :(");
            }
            throw err;
        }
    }
    