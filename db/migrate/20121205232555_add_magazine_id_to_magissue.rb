class AddMagazineIdToMagissue < ActiveRecord::Migration
  def change
    add_column :magissues, :magazine_id, :integer
  end
end
