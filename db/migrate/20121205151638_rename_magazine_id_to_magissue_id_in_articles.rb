class RenameMagazineIdToMagissueIdInArticles < ActiveRecord::Migration
  def up
    rename_column :articles, :magazine_id, :magissue_id
  end

  def down
    rename_column :articles, :magissue_id, :magazine_id
  end
end
