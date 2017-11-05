var editor = new LWBFEditor(
    {
        code              : document.getElementById("code"),
        run_button        : document.getElementById("run-button"),
        compile_button    : document.getElementById("compile-button"),
        debug_button      : document.getElementById("debug-button"),
        input             : document.getElementById("input"),
        output            : document.getElementById("output"),
        memory            : document.getElementById("memory"),
        cell_size         : document.getElementById("cell-size"),
        optimize          : document.getElementById('optimize'),
        compiled_code_out : document.getElementById('compiled-code'),
        debug_code        : document.getElementById('editor-debug-code'),
        step_button       : document.getElementById('step-button'),
        step_out_button   : document.getElementById('step-out-of-loop-button'),
        stop_button       : document.getElementById('stop-button'),
        reset_button      : document.getElementById('reset-button'),
        memory_dump       : document.getElementById('memory-dump')
    }
);

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

// Tab functionality
$("#editor-tabs .nav-link").each(function(){
    $(this).click(function(e){
        e.preventDefault();
        if(/active/.test(this.className)) return;

        $("#editor-tabs .nav-link").each(function(){
            if(/active/.test(this.className)){
                this.className = this.className.replace(/\sactive/, '');
                $($(this).attr("href").toString()).hide();
            }
        });
        this.className += " active";
        $($(this).attr("href").toString()).show();
    });
});
