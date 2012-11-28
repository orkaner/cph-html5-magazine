Paperclip::Attachment.default_options.update({
                                                 :storage => :fog,
                                                 :fog_credentials => {
                                                     :provider                         => 'Google',

                                                     :google_storage_access_key_id     => 'GOOGMCZOXQDTCBVWZOHT',
                                                     :google_storage_secret_access_key => 'CG+UO42HAurabFdd1T1HKf5k2AZgSK9Da1e7WaY0'
                                                 },
                                                 :fog_directory => "ezine",
                                                 :fog_public => "true"

                                             })
