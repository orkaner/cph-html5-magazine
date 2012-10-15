/**
 * Created with JetBrains RubyMine.
 * User: naoufal
 * Date: 13/10/12
 * Time: 21.49
 * To change this template use File | Settings | File Templates.
 */

/**
 * This code is extracted and adapted from "Default.htm" bundled with jHtmlArea source code at:
 * http://jhtmlarea.codeplex.com/releases/view/92200
 */


// You can do this to perform a global override of any of the "default" options
    // jHtmlArea.fn.defaultOptions.css = "jHtmlArea.Editor.css";

$(function() {
    //$("textarea").htmlarea(); // Initialize all TextArea's as jHtmlArea's with default values

    //$("#article_text").htmlarea(); // Initialize jHtmlArea's with all default values

    $("#article_text").htmlarea({
        // Override/Specify the Toolbar buttons to show
        toolbar: [
            ["html"],
            ["bold", "italic"/*, "|", "forecolor"*/],
            ["p", "h1", "h2", "h3"/*, "h4", "h5", "h6"*/],
            //["link", "unlink", "|", "image"],
//            [{
//                // This is how to add a completely custom Toolbar Button
//                css: "custom_disk_button",
//                text: "Save",
//                action: function(btn) {
//                    // 'this' = jHtmlArea object
//                    // 'btn' = jQuery object that represents the <A> "anchor" tag for the Toolbar Button
//                    alert('SAVE!\n\n' + this.toHtmlString());
//                }
//            }]
        ],

        // Override any of the toolbarText values - these are the Alt Text / Tooltips shown
        // when the user hovers the mouse over the Toolbar Buttons
        // Here are a couple translated to German, thanks to Google Translate.
        toolbarText: $.extend({}, jHtmlArea.defaultOptions.toolbarText, {
            "bold": "fett",
            "italic": "kursiv",
            "underline": "unterstreichen"
        }),

        // Specify a specific CSS file to use for the Editor
        css: "style//jHtmlArea.Editor.css",

        // Do something once the editor has finished loading
        loaded: function() {
            //// 'this' is equal to the jHtmlArea object
            //alert("jHtmlArea has loaded!");
            //this.showHTMLView(); // show the HTML view once the editor has finished loading
        }
    });
});
