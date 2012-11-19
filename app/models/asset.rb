class Asset < ActiveRecord::Base
  attr_accessible :article_id, :asset_content_type, :asset_file_name, :asset_file_size, :asset_updated_at , :asset , :imageable_id , :imageable_type
  #polymorphic relation where a picture can belong to articles and other models
  belongs_to :imageable, :polymorphic => true
              :article
  has_attached_file :asset,
                    :styles => {
                        :thumb=> "70x70#",
                        :single280  => "280x200#",
                        :double280 => "590x400#" ,
                        :single140 => "140x140#" ,
                        :double140 => "300x280#"
  }                     ,

                    :url  => "/assets/articles/:id/:style/:basename.:extension"   ,
                    :path => ":rails_root/public/assets/articles/:id/:style/:basename.:extension"





end
