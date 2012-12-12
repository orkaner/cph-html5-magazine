# spec/factories/magissues.rb

FactoryGirl.define do
  factory :magissue do |f|
    f.association :magazine
    f.association :magtemplate
    f.date Date.today #parse('2012-12-01')
    f.status "Not Published"
  end
end