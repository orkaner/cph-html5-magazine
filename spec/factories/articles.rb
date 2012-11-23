

FactoryGirl.define do
  factory :article do |f|
    f.title "Example title"
    f.headline "Example headline"
    f.author "Donald Duck"
    f.status "Draft"
    f.text "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a fringilla nunc."
  end
end