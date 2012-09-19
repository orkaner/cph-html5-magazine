class AddGridIdToArticle < ActiveRecord::Migration
  def change
    add_column :articles, :grid_id, :integer
  end
end
