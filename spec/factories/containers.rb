

FactoryGirl.define do

  factory :container do |f|
    f.association :grid
    f.association :width
    f.data_sizes "title single"
    f.pictures true
    f.text true
    f.video true
  end
end