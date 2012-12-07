class RemoveNameFromMagissue < ActiveRecord::Migration
  def up
    remove_column :magissues, :name
  end

  def down
    add_column :magissues, :name, :string
  end
end
