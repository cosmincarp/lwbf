const CELL_8_BIT                    = 8;
const CELL_16_BIT                   = 16;
const CELL_32_BIT                   = 32;
const DEFAULT_MEMORY_SIZE           = 256;
const ENV_EDITOR                    = 1;
const ENV_NATIVE                    = 2;
const ENV_DEBUG                     = 3;

// Error codes
const COMP_ERR_LOOP_NOT_CLOSED      = 0;
const COMP_ERR_LOOP_NOT_OPENED      = 1;
const COMP_ERR_ENV_UNKNOWN          = 2;
const COMP_ERR_CODE_INPUT           = 3;
const COMP_ERR_SETTINGS             = 4;

const OP_ADD                        = 0;
const OP_SUB                        = 1;
const OP_LEFT                       = 2;
const OP_RIGHT                      = 3;
const OP_LOOP                       = 4;
const OP_POOL                       = 5;
const OP_IN                         = 6;
const OP_OUT                        = 7;
const OP_DEBUG                      = 8;

const OP_TYPE_ALG                   = 0;
const OP_TYPE_MEM                   = 1;
const OP_TYPE_IO                    = 2;
const OP_TYPE_LOOP                  = 3;
const OP_TYPE_DEBUG                 = 4;