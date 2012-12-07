class RenameMagazinesToMagissues < ActiveRecord::Migration
  def change
    rename_table :magazines, :magissues
  end
end
