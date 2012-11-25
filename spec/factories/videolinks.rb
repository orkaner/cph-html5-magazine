

FactoryGirl.define do
  factory :videolink do |f|
    f.article_id nil
    f.title "Example video title"
    f.embed_code '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
                     ' frameborder="0" allowfullscreen></iframe>'
    f.embedded true
  end
end