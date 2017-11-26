class LWBFCompiler {

    constructor(/* settings */){
        this.cellSize        = CELL_8_BIT;
        this.memorySize      = DEFAULT_MEMORY_SIZE;
        this.environment     = ENV_EDITOR;
        this.debug           = false;
        this.optimize        = true;
        this.surpressErrors  = false;
        this.preproc         = true;

        for(let i = 0; i < arguments.length; i++){
            if(typeof(arguments[i]) == "object"){
                Object.assign(this, arguments[i]);
            }
        }
    }

    compile(code){
        var parsedCode, optimizedCode, prevToken, token, numOfRepeats, i,
            optimizedCodeLevel2, offset, compiledCode, loops, lookAhead;

        if(typeof(code) != "string" || code.length == 0){
            throw new Error("Argument of function must be string.");
            return;
        }

        // cleaning
        if(this.debug){
            code = code.replace(/[^\>\<\+\-\.\,\[\]\#]/g, '');  // removes any characters that are not supported in the language
            code = code.replace(/#.+$/, '#');                   // removes all characters after #
        } else {
            code = code.replace(/[^\>\<\+\-\.\,\[\]]/g, '');
        }

        compiledCode = '';
        compiledCode += "var m=new Uint" + this.cellSize.toString() + "Array(" + this.memorySize.toString() + "),";
        compiledCode += "i=0,j=0,o=\'\',p=String.fromCharCode;";

        if(code.length == 0){
            return;
        }

/*
        // optimization before parsing (beta)
        //TODO: maybe work on this more?
        var newCode = code;
        var regex = /([\+\-]+)|([\>\<]+)/g;
        var results = regex.exec(code);
        while(results != null){
            console.log(results);
            var substr  = (typeof(results[1]) == "undefined") ? results[2] : results[1];
            var group   = (typeof(results[1]) == "undefined") ? OP_TYPE_MEM : OP_TYPE_ALG;
            var index   = results.index;

            offset = 0;
            for(let char of substr){
                switch (char) {
                    case '+':
                    case '>':
                        offset++;
                        break;
                    case '-':
                    case '<':
                        offset--;
                        break;
                    default:
                }
            }
            if(offset){
                let prevCode = newCode.slice(0, index);
                let nextCode = code.slice(index+substr.length);
                newCode += prevCode;
                switch (group) {
                    case OP_TYPE_ALG:
                        if(offset > 0){
                            while(offset > 0){
                                newCode += '+';
                                offset--;
                            }
                        } else {
                            while(offset < 0){
                                newCode += '-';
                                offset++;
                            }
                        }
                        break;
                    case OP_TYPE_MEM:
                        if(offset > 0){
                            while(offset > 0){
                                newCode += '>';
                                offset--;
                            }
                        } else {
                            while(offset < 0){
                                newCode += '<';
                                offset++;
                            }
                        }
                        break;
                    default:
                }
                newCode += nextCode;
            }
            results = regex.exec(code);
        }
*/
        // parsing
        parsedCode = []
        //for(let token of code){
        for(let i = 0; i < code.length; ++i) {
            token = code[i];
            switch(token){
                case '+':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_ADD,
                        type: OP_TYPE_ALG,
                        occurrences: 1
                    });
                    break;
                case '-':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_SUB,
                        type: OP_TYPE_ALG,
                        occurrences: 1
                    });
                    break;
                case '>':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_RIGHT,
                        type: OP_TYPE_MEM,
                        occurrences: 1
                    });
                    break;
                case '<':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_LEFT,
                        type: OP_TYPE_MEM,
                        occurrences: 1
                    });
                    break;
                case '[':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_LOOP,
                        type: OP_TYPE_LOOP,
                        occurrences: 1
                    });
                    break;
                case ']':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_POOL,
                        type: OP_TYPE_LOOP,
                        occurrences: 1
                    });
                    break;
                case '.':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_OUT,
                        type: OP_TYPE_IO,
                        occurrences: 1
                    });
                    break;
                case ',':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_IN,
                        type: OP_TYPE_IO,
                        occurrences: 1
                    });
                    break;
                case '#':
                    parsedCode.push({
                        symbol: token,
                        instruction: OP_DEBUG,
                        type: OP_TYPE_DEBUG,
                        occurrences: 1,
                        additional:
                        {
                            ip: i
                        }
                    });
                    break;
                default:
            }
        }

        // optimization
        if(this.optimize){

            // optimization level / step 1
            // compression
            // grouping adiacent identical operations
            i = 1;
            numOfRepeats = 1;
            optimizedCode = [];

            prevToken = parsedCode[0];
            while(i < parsedCode.length){
                if(prevToken.instruction == parsedCode[i].instruction){
                    numOfRepeats++;
                    i++;
                    continue;
                } else {
                    // optimizedCode.push({
                    //     symbol: prevToken.symbol,
                    //     instruction: prevToken.instruction,
                    //     type: prevToken.type,
                    //     complementary: ((prevToken.type == OP_TYPE_ALG || prevToken.type == OP_TYPE_MEM) ? true : false),
                    //     occurrences: numOfRepeats
                    // });

                    // FIX keep additional field
                    prevToken.complementary =  ((prevToken.type == OP_TYPE_ALG || prevToken.type == OP_TYPE_MEM) ? true : false);
                    prevToken.occurrences = numOfRepeats;
                    optimizedCode.push(prevToken);

                    numOfRepeats = 1;
                    prevToken = parsedCode[i];
                    i++;
                }
            }

            // optimizedCode.push({
            //     symbol: prevToken.symbol,
            //     instruction: prevToken.instruction,
            //     type: prevToken.type,
            //     occurrences: numOfRepeats
            // });
            prevToken.occurrences = numOfRepeats;
            optimizedCode.push(prevToken);

            // optimization level 2
            // grouping adiacent complementary operations (+/- </>)
            i = 0;
            offset = 0;
            lookAhead = 0;
            optimizedCodeLevel2 = [];
            prevToken = optimizedCode[0];
            while(i < optimizedCode.length){

                // fixed version
                if(!prevToken.complementary){
                    optimizedCodeLevel2.push(prevToken);
                    i++;
                    prevToken = optimizedCode[i];
                    continue;
                }

                // is complementary
                offset = 0;
                for(lookAhead = 0; i+lookAhead < optimizedCode.length && prevToken.type == optimizedCode[i+lookAhead].type; lookAhead++){
                    switch (optimizedCode[i+lookAhead].instruction) {
                        case OP_ADD:
                        case OP_RIGHT:
                            offset += optimizedCode[i+lookAhead].occurrences;
                            break;
                        case OP_SUB:
                        case OP_LEFT:
                            offset -= optimizedCode[i+lookAhead].occurrences;
                            break;
                        default:
                            //TODO: (18/08/17) throw some kind of error
                    }
                }
                switch (prevToken.type) {
                    case OP_TYPE_ALG:
                        if(offset > 0){
                            optimizedCodeLevel2.push({
                                symbol: '+',
                                instruction: OP_ADD,
                                type: OP_TYPE_ALG,
                                occurrences: offset
                            });
                        } else if( offset < 0){
                            optimizedCodeLevel2.push({
                                symbol: '-',
                                instruction: OP_SUB,
                                type: OP_TYPE_ALG,
                                occurrences: -offset
                            });
                        }
                        break;
                    case OP_TYPE_MEM:
                        if(offset > 0){
                            optimizedCodeLevel2.push({
                                symbol: '>',
                                instruction: OP_RIGHT,
                                type: OP_TYPE_MEM,
                                occurrences: offset
                            });
                        } else if( offset < 0){
                            optimizedCodeLevel2.push({
                                symbol: '<',
                                instruction: OP_LEFT,
                                type: OP_TYPE_MEM,
                                occurrences: -offset
                            });
                        }
                        break;
                    default:
                }

                offset = 0;
                i += lookAhead;
                prevToken = optimizedCode[i];
            }
        } else {
            optimizedCodeLevel2 = parsedCode;
        }

        // Generate code
        loops = 0;
        // openedLoops = [];
        // for(var [index,token] of optimizedCodeLevel2){
        for(var index = 0; index < optimizedCodeLevel2.length; ++index) {
            let token = optimizedCodeLevel2[index];
            switch (token.instruction) {

                case OP_ADD:
                    if(token.occurrences == 1){
                        compiledCode += "m[i]++;";
                    } else {
                        compiledCode += "m[i]+=" + token.occurrences.toString() + ";";
                    }
                    break;

                case OP_SUB:
                    if(token.occurrences == 1){
                        compiledCode += "m[i]--;";
                    } else {
                        compiledCode += "m[i]-=" + token.occurrences.toString() + ";";
                    }

                    break;

                case OP_LEFT:
                    if(token.occurrences == 1){
                        compiledCode += "i--;";
                    } else {
                        compiledCode += "i-=" + token.occurrences.toString() + ";";
                    }

                    break;

                case OP_RIGHT:
                    if(token.occurrences == 1){
                        compiledCode += "i++;";
                    } else {
                        compiledCode += "i+=" + token.occurrences.toString() + ";";
                    }
                    break;

                case OP_LOOP:
                    for(let loops_iterator = 0; loops_iterator < token.occurrences; loops_iterator++){
                        compiledCode += "if(m[i])";
                        compiledCode += "do{";
                        loops++;
                        // openedLoops.push(index);
                    }
                    break;

                case OP_POOL:
                    for(let loops = 0; loops < token.occurrences; loops++){
                        compiledCode += "}while(m[i]);";
                        // loops--;
                        // openedLoops.pop();
                    }
                    break;

                case OP_IN:
                    compiledCode += "m[i]=n[j];j++;";
                    break;

                case OP_OUT:
                    for(let outs = 0; outs < token.occurrences; outs++){
                        compiledCode += "o+=p(m[i]);";
                        compiledCode += "console.log(p(m[i]));";
                    }
                    break;

                case OP_DEBUG:
                    while(this.debug && loops > 0){
                        compiledCode += "}while(0);";
                        loops--;
                        // openedLoops.pop();
                    }
                    // for(let i = 0; i < openedLoops.length; ++i) {
                    //     compiledCode += "}while(0);";
                    // }
                    compiledCode += "return {memory: m, data_pointer: i, instruction_pointer:"
                                    + token.additional.ip.toString() +
                                    ", output: o, input: n, input_pointer:j, no_breakpoint: false};";
                    var openedLoops = [];
                    for(let i = 0; i < code.length && code[i] != '#'; ++i)
                    {
                        switch(code[i])
                        {
                            case '[':
                                openedLoops.push(i);
                                break;

                            case ']':
                                openedLoops.pop(i);
                                break;
                        }
                    }
                    return {compiledCode, openedLoops};
                    break;

                default:
                    break;
            }
        }

        if(this.debug) {
            compiledCode += "return {memory: m, data_pointer: i, output: o, input: n, input_pointer:j, no_breakpoint: true};";
        }
        else if(this.environment == ENV_NATIVE)
        {
            compiledCode += "console.log(o);"
        }
        else {
            compiledCode += "return o;";
        }

        return compiledCode;
        // return [parsedCode, optimizedCode, optimizedCodeLevel2, compiledCode];
    }


}
