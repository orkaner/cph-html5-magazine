class AddMagtemplateIdToMagazine < ActiveRecord::Migration
  def change
    add_column :magazines, :magtemplate_id, :integer
  end
end
