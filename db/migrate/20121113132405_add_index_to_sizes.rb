class AddIndexToSizes < ActiveRecord::Migration
  def change
    add_index :sizes, [:magtemplate_id, :width_id], :unique => true

  end
end
