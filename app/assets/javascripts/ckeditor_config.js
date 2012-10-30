/**
 * Created with JetBrains RubyMine.
 * User: naoufal
 * Date: 29/10/12
 * Time: 13.32
 * To change this template use File | Settings | File Templates.
 */

/**
 This file containers the configuration settings for the text editor "CkEditor"
 */

CKEDITOR.editorConfig = function( config )
{
    // Define changes to default configuration here. For example:
    // config.language = 'fr';
    // config.uiColor = '#AADC6E';

    // Naoufal:-------------------------------
    // Language
    // config.language = 'da';  // Set the language of the text editor to danish.

    // Toolbars
    config.toolbar = 'Custom';

    config.toolbar_Custom =
        [
            { name: 'document', items : [ 'Source','-','Save'] },
            { name: 'clipboard', items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
            { name: 'tools', items : [ 'Maximize', 'ShowBlocks','-','About' ] },
            '/',
            { name: 'styles', items : [ 'Format' ] },
            { name: 'basicstyles', items : [ 'Bold','Italic','-','RemoveFormat' ] },
            { name: 'paragraph', items : [ 'NumberedList','BulletedList'] },
            { name: 'links', items : [ 'Link','Unlink'] },
            { name: 'insert', items : [ 'SpecialChar' ] }

        ];

    config.toolbar_Full =
        [
            { name: 'document', items : [ 'Source','-','Save','NewPage','DocProps','Preview','Print','-','Templates' ] },
            { name: 'clipboard', items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
            { name: 'editing', items : [ 'Find','Replace','-','SelectAll','-','SpellChecker', 'Scayt' ] },
            { name: 'forms', items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton',
                'HiddenField' ] },
            '/',
            { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
            { name: 'paragraph', items : [ 'NumberedList','BulletedList','-','Outdent','Indent','-','Blockquote','CreateDiv',
                '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
            { name: 'links', items : [ 'Link','Unlink','Anchor' ] },
            { name: 'insert', items : [ 'Image','Flash','Table','HorizontalRule','Smiley','SpecialChar','PageBreak','Iframe' ] },
            '/',
            { name: 'styles', items : [ 'Styles','Format','Font','FontSize' ] },
            { name: 'colors', items : [ 'TextColor','BGColor' ] },
            { name: 'tools', items : [ 'Maximize', 'ShowBlocks','-','About' ] }
        ];

    // TODO: Customise the paragraph formatting list
    config.format_tags = 'p;h1;h2;h3;pre';
};