FactoryGirl.define do

  factory :asset do |f|
    f.association :imageable, :factory => :article
    #f.asset_file_name fixture_file_upload('alice.jpg', 'image/jpg')
    #asset { fixture_file_upload(Rails.root.join('spec', 'fixtures', 'alice.png'), 'image/png') }
  end
end