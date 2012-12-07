

FactoryGirl.define do
  factory :article do |f|
    f.association :grid
    f.association :magissue
    f.title "Example title"
    f.headline "Example headline"
    f.author "Donald Duck"
    f.status "Draft"
    f.text "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a fringilla nunc."

    #after_create {|f| FactoryGirl.create(:asset, :imageable => f)}
  end
end