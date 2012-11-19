class CreateVideolinks < ActiveRecord::Migration
  def change
    create_table :videolinks do |t|
      t.string :title
      t.string :embed_code
      t.boolean :embedded
      t.integer :article_id

      t.timestamps
    end
  end
end
