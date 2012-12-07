# spec/factories/magissues.rb

FactoryGirl.define do
  factory :magissue do |f|
    f.association :magazine
    f.association :magtemplate
    f.date Date.parse('2012-12-01')
  end
end