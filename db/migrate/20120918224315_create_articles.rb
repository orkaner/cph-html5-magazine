class CreateArticles < ActiveRecord::Migration
  def change
    create_table :articles do |t|
      t.string :title
      t.string :author
      t.string :headline
      t.date :date
      t.decimal :version
      t.string :status
      t.text :text

      t.timestamps
    end
  end
end
