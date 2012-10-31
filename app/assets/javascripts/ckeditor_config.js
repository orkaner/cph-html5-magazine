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

    // Naoufal:---------------------------------------------------------------------------------------------------------
    // Language
    // config.language = 'da';  // Set the language of the text editor to danish.

    // Toolbars
    // Set the toolbar to use. Note that the name of the toolbar is token from the definition name of the toolbar.
    // For example: if the toolbar is defined like config.toolbar_MyToolbar = [...], then to use it :
    // config.toolbar = 'MyToolbar'
    config.toolbar = 'Custom';

    // A customized toolbar to suits the needs of the application
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

    // The full toolbar with all the default buttons and dialog windows
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

    // Customise the paragraph formatting list
    config.format_tags = 'p;h1;h2;h3;pre';

    // Naoufal: Experimentation =============================================
    // To load non-default plugins. If there is a need for more than one then add as a comma-separated list like:
    // config.extraPlugins = 'plugin1, plugin2, plugin3'
    /*config.extraPlugins = 'pics';
    config.toolbar_exp = [
        [ 'Source', 'Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink' ],
        [ 'Timestamp', '-', 'Pics' ]
    ];*/
};