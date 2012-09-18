class AddMagazineIdToArticle < ActiveRecord::Migration
  def change
    add_column :articles, :magazine_id, :integer
  end
end
