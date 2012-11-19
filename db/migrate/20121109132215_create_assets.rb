class CreateAssets < ActiveRecord::Migration
  def change
    create_table :assets do |t|
      t.string :asset_file_name
      t.integer :asset_content_type
      t.integer :asset_file_size
      t.datetime :asset_updated_at
      t.integer :article_id
      t.references :imageable, :polymorphic => true
      t.timestamps
    end
  end
end
