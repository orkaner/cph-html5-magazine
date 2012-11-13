class CreateWidths < ActiveRecord::Migration
  def change
    create_table :widths do |t|
      t.string :name

      t.timestamps
    end
  end
end
