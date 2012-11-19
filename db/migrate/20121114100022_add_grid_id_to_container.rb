class AddGridIdToContainer < ActiveRecord::Migration
  def change
    add_column :containers, :grid_id, :integer
  end
end
