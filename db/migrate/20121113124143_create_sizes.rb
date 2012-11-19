class CreateSizes < ActiveRecord::Migration
  def change
    create_table :sizes do |t|
      t.integer :magtemplate_id
      t.integer :width_id
      t.integer :value

      t.timestamps
    end
  end
end
