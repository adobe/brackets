
// TODO

(function() {


    function dialogDiv(cm, template) {
        var wrap = cm.getWrapperElement();
        var dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        dialog.className = "CodeMirror-dialog";
        dialog.innerHTML = '<div>' + template + '</div>';
        return dialog;
    }

    /*
     * Options:
     *  closeOnEnterKey
     *  closeOnClick
     */
    CodeMirror.defineExtension("openEditorDialog", function(template, options, callback) {
        var dialog = dialogDiv(this, template);
        var closed = false, me = this;
        var inp = dialog.getElementsByTagName("input")[0];

        function close(value) {
            if (closed)
                return;
                
            closed = true;
            dialog.parentNode.removeChild(dialog);

            if(value)
              callback(value);
        }



        if (inp) {
            CodeMirror.connect(inp, "keydown", function(e) {
                if ( (e.keyCode == 13 && options.closeOnEnterKey) || e.keyCode == 27) {
                    CodeMirror.e_stop(e);
                    close();
                    me.focus();
                    if (e.keyCode == 13) callback(inp.value);
                }
            });

            CodeMirror.connect(inp, "click", function(e) {
                if (options.closeOnClick) {
                    CodeMirror.e_stop(e);
                    close();
                    me.focus();
                }
            });

            inp.focus();
            CodeMirror.connect(inp, "blur", close);
        }
        return close;
    });



})();