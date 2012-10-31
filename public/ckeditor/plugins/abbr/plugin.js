/**
 * Created with JetBrains RubyMine.
 * User: naoufal
 * Date: 30/10/12
 * Time: 13.30
 * To change this template use File | Settings | File Templates.
 */

CKEDITOR.plugins.add('abbr',
    {
        init: function(editor)
        {
            var iconPath = this.path + 'images/icon.png';
            editor.addCommand('abbrDialog', new CKEDITOR.dialogCommand('abbrDialog'));
            editor.ui.addButton('Abbr',
                {
                    label: 'Insert Abbreviation',
                    command: 'abbrDialog',
                    icon: iconPath
                });
            if (editor.contextMenu)
            {
                editor.addMenuGroup('myGroup');
                editor.addMenuItem('abbrItem',
                    {
                        label: 'Edit Abbreviation',
                        icon: iconPath,
                        command: 'abbrDialog',
                        group: 'myGroup'
                    });
                editor.contextMenu.addListener(function(element)
                {
                    if(element)
                    {
                        element = element.getAscendant('abbr', true);
                    }
                    if (element && !element.isReadOnly() && !element.data('cke-realelement'))
                    {
                        return { abbrItem: CKEDITOR.TRISTATE_OFF};
                    }
                    return null;
                });
            }
            CKEDITOR.dialog.add('abbrDialog',
                function(editor){
                    return {
                        title: 'Abbreviation Properties',
                        minWidth: 400,
                        minHeight: 200,
                        contents:
                            [
                                {
                                    id: 'tab1',
                                    label: 'Basic Settings',
                                    elements:
                                        [
                                            // UI elements of the first tab
                                            {
                                                type: 'text',
                                                id: 'abbr',
                                                label: 'Abbreviation',
                                                validate: CKEDITOR.dialog.validate.notEmpty("Abbreviation field cannot be empty"),
                                                setup: function(element)
                                                {
                                                    this.setValue(element.getText());
                                                },
                                                commit: function(element)
                                                {
                                                    element.setText(this.getValue());
                                                }
                                            },
                                            {
                                                type: 'text',
                                                id: 'title',
                                                label: 'Explanation',
                                                validate: CKEDITOR.dialog.validate.notEmpty("Explanation field cannot be empty"),
                                                setup: function(element)
                                                {
                                                    this.setValue(element.getAttribute("title"));
                                                },
                                                commit: function(element)
                                                {
                                                    element.setAttribute("title", this.getValue());
                                                }
                                            }
                                        ]
                                },
                                {
                                    id: 'tab2',
                                    label: 'Advanced Settings',
                                    elements:
                                        [
                                            // UI elements of the second tab
                                            {
                                                type: 'text',
                                                id: 'id',
                                                label: 'Id',
                                                setup: function(element)
                                                {
                                                    this.setValue(element.getAttribute("id"));
                                                },
                                                commit: function(element)
                                                {
                                                    var id = this.getValue();
                                                    if (id)
                                                    {
                                                        element.setAttribute('id', id);
                                                    }
                                                    else if(!this.insertMode)
                                                    {
                                                        element.removeAttribute('id');
                                                    }
                                                }
                                            }
                                        ]
                                }
                            ],

                        onOk : function()
                        {
                            // Without taking in consideration editing ability:
                            /*
                            var dialog = this;
                            var abbr = editor.document.createElement( 'abbr' );

                            abbr.setAttribute( 'title', dialog.getValueOf( 'tab1', 'title' ) );
                            abbr.setText( dialog.getValueOf( 'tab1', 'abbr' ) );

                            var id = dialog.getValueOf( 'tab2', 'id' );
                            if ( id )
                                abbr.setAttribute( 'id', id );
                            editor.insertElement( abbr );
                            */

                            // Considering editing ability:
                            var dialog = this,
                                abbr = this.element;
                            if (this.insertMode)
                            {
                                editor.insertElement(abbr);
                            }
                            this.commitContent(abbr);
                        },

                        onShow: function()
                        {
                            // The code that will be executed when a dialog window is loaded.
                            var sel = editor.getSelection(),
                                element = sel.getStartElement();
                            if (element)
                            {
                                element = element.getAscendant('abbr', true);
                            }
                            if (!element || element.getName() != 'abbr' || element.data('cke-realelement'))
                            {
                                element = editor.document.createElement('abbr');
                                this.insertMode = true;
                            }
                            else
                            {
                                this.insertMode = false;
                            }
                            this.element = element;
                            this.setupContent(this.element);
                        }
                    };
            });
        }
    });