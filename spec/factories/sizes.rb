FactoryGirl.define do
  factory :size do |f|
    f.association :magtemplate
    f.association :width
    f.value 280
  end
end