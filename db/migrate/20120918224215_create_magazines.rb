class CreateMagazines < ActiveRecord::Migration
  def change
    create_table :magazines do |t|
      t.string :name
      t.date :date
      t.integer :volume
      t.integer :number
      t.string :status

      t.timestamps
    end
  end
end
