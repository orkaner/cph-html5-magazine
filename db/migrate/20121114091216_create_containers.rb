class CreateContainers < ActiveRecord::Migration
  def change
    create_table :containers do |t|
      t.string :data_sizes
      t.boolean :pictures
      t.boolean :text
      t.boolean :video
      t.integer :width_id

      t.timestamps
    end
  end
end
