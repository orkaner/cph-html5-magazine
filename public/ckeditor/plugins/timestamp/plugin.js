/**
 * Created with JetBrains RubyMine.
 * User: naoufal
 * Date: 30/10/12
 * Time: 12.36
 * To change this template use File | Settings | File Templates.
 */

CKEDITOR.plugins.add('timestamp',
    {
        init: function(editor)
        {
            // Plugins logic goes here.
            editor.addCommand('insertTimestamp',
                {
                    exec: function(editor)
                    {
                        var timestamp = new Date();
                        editor.insertHtml('The current date and time is: <em>' + timestamp.toString() + '</em>');
                    }
                });
            editor.ui.addButton('Timestamp',
                {
                    label: 'Insert Timestamp',
                    command: 'insertTimestamp',
                    icon: this.path + 'images/timestamp.png'
                });
        }

    });
