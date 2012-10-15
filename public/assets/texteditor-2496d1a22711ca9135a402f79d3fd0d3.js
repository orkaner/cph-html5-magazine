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
$(function(){$("#article_text").htmlarea({toolbar:[["html"],["bold","italic"],["p","h1","h2","h3"]],toolbarText:$.extend({},jHtmlArea.defaultOptions.toolbarText,{bold:"fett",italic:"kursiv",underline:"unterstreichen"}),css:"style//jHtmlArea.Editor.css",loaded:function(){}})});