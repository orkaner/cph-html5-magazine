/**
 * Created with JetBrains RubyMine.
 * User: naoufal
 * Date: 30/10/12
 * Time: 15.51
 * To change this template use File | Settings | File Templates.
 */

/**
 * This plugin displays a dialog window allowing inserting a picture in a document in a compatible way with Treesaver.
 * Note: this plugin is experimental and has to be further developed and tested before it can be used safely. Especially,
 * the editor wil try to correct some custom attributes (like "data-src") that it might think to be errors. To fix that,
 * customising the HTML filter and processor might be necessary. Also, there is an issue where the editor inserts a 'p'
 * element inside the 'figure' element, which causes a wrong rendering by Treesaver.
 */

// Register the plugin with the editor.
// http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.plugins.html
CKEDITOR.plugins.add( 'pics',
    {
        // The plugin initialization logic goes inside this method.
        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.pluginDefinition.html#init
        init: function( editor )
        {
            // Define an editor command that inserts a picture.
            // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.editor.html#addCommand
            editor.addCommand( 'picsDialog',new CKEDITOR.dialogCommand( 'picsDialog' ) );
            // Create a toolbar button that executes the plugin command.
            // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.ui.html#addButton
            editor.ui.addButton( 'Pics',
                {
                    // Toolbar button tooltip.
                    label: 'Insert Picture',
                    // Reference to the plugin command name.
                    command: 'picsDialog',
                    // Button's icon file path.
                    icon: this.path + 'images/uicolor.gif'
                } );
            // Add a dialog window definition containing all UI elements and listeners.
            // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.html#.add
            CKEDITOR.dialog.add( 'picsDialog', function ( editor )
            {
                return {
                    // Basic properties of the dialog window: title, minimum size.
                    // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.dialogDefinition.html
                    title : 'Insert Picture',
                    minWidth : 400,
                    minHeight : 200,
                    // Dialog window contents.
                    // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.definition.content.html
                    contents :
                        [
                            {
                                // Definition of the Basic Settings dialog window tab (page) with its id, label, and contents.
                                // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.contentDefinition.html
                                id : 'tab1',
                                label : 'Picture',
                                elements :
                                    [
                                        {
                                            // Dialog window UI element: a text input field for the URL.
                                            // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.ui.dialog.textInput.html
                                            type : 'text',
                                            id : 'url',
                                            // Text that labels the field.
                                            // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.ui.dialog.labeledElement.html#constructor
                                            label : 'URL',
                                            // Validation checking whether the field is not empty.
                                            validate : CKEDITOR.dialog.validate.notEmpty( "URL field cannot be empty" )
                                        },
                                        {
                                            // Another text input field for the data-sizes attribute with a label and validation.
                                            type : 'text',
                                            id : 'data_sizes',
                                            label : 'Size',
                                            validate : CKEDITOR.dialog.validate.notEmpty( "Size field cannot be empty" )
                                        },
                                        {
                                            // Another text input field for the width attribute with a label and validation.
                                            type : 'text',
                                            id : 'width',
                                            label : 'Width',
                                            validate : CKEDITOR.dialog.validate.notEmpty( "Width field cannot be empty" )
                                        },
                                        {
                                            // Another text input field for the height attribute with a label and validation.
                                            type : 'text',
                                            id : 'height',
                                            label : 'Height',
                                            validate : CKEDITOR.dialog.validate.notEmpty( "Height field cannot be empty" )
                                        },
                                        {
                                            // Another text input field for the alt attribute with a label.
                                            // Here no validation is required since this field is optional.
                                            type : 'text',
                                            id : 'alt',
                                            label : 'Alternative text'

                                        }
                                    ]
                            }
                        ],
                    // This method is invoked once a user closes the dialog window, accepting the changes.
                    // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.dialogDefinition.html#onOk
                    onOk : function()
                    {
                        // A dialog window object.
                        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.html
                        var dialog = this;
                        // Create new figure and img elements and an object that will hold the data entered in the dialog window.
                        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dom.document.html#createElement
                        var figure = editor.document.createElement( 'figure' );
                        var img = editor.document.createElement( 'img' );

                        // Retrieve the value of the "url" field from the "tab1" dialog window tab.
                        // Send it to the created element as the "src" attribute.
                        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dom.element.html#setAttribute
                        img.setAttribute( 'src', dialog.getValueOf( 'tab1', 'url' ) );

                        // Similarly, continue with the rest of fields
                        img.setAttribute( 'data-sizes', dialog.getValueOf( 'tab1', 'data_sizes' ) );
                        img.setAttribute( 'width', dialog.getValueOf( 'tab1', 'width' ) );
                        img.setAttribute( 'height', dialog.getValueOf( 'tab1', 'height' ) );


                        // Retrieve the value of the "alt" field from the "tab1" dialog window tab.
                        // If it is not empty, send it to the created img element.
                        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.dialog.html#getValueOf

                        var alt = dialog.getValueOf( 'tab1', 'alt' );
                        if ( alt )
                            img.setAttribute( 'alt', alt );

                        // Append the img element to the element figure as a child node
                        figure.append(img);

                        // Insert the newly created figure into the cursor position in the document.
                        // http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.editor.html#insertElement
                        editor.insertElement( figure );


                    }
                };
            } );
        }
    } );