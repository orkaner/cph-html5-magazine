# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20121114100022) do

  create_table "articles", :force => true do |t|
    t.string   "title"
    t.string   "author"
    t.string   "headline"
    t.date     "date"
    t.decimal  "version"
    t.string   "status"
    t.text     "text"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.integer  "magazine_id"
    t.integer  "grid_id"
  end

  create_table "containers", :force => true do |t|
    t.string   "data_sizes"
    t.boolean  "pictures"
    t.boolean  "text"
    t.boolean  "video"
    t.integer  "width_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.integer  "grid_id"
  end

  create_table "grids", :force => true do |t|
    t.string   "name"
    t.string   "path"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "magazines", :force => true do |t|
    t.string   "name"
    t.date     "date"
    t.integer  "volume"
    t.integer  "number"
    t.string   "status"
    t.datetime "created_at",     :null => false
    t.datetime "updated_at",     :null => false
    t.integer  "magtemplate_id"
  end

  create_table "magtemplates", :force => true do |t|
    t.string   "name"
    t.string   "path"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "sizes", :force => true do |t|
    t.integer  "magtemplate_id"
    t.integer  "width_id"
    t.integer  "value"
    t.datetime "created_at",     :null => false
    t.datetime "updated_at",     :null => false
  end

  add_index "sizes", ["magtemplate_id", "width_id"], :name => "index_sizes_on_magtemplate_id_and_width_id", :unique => true

  create_table "widths", :force => true do |t|
    t.string   "name"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

end
