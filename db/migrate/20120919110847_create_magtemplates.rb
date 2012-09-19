class CreateMagtemplates < ActiveRecord::Migration
  def change
    create_table :magtemplates do |t|
      t.string :name
      t.string :path

      t.timestamps
    end
  end
end
