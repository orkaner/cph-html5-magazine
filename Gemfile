source 'https://rubygems.org'

gem 'rails', '3.2.8'

# Naoufal: This gem validate the existence of a record when referring
#          to it from a database relationship
gem "validates_existence", ">= 0.4"

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

gem 'pg'

#gem 'rspec'  # Naoufal: Not necessary anymore
# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'

  # See https://github.com/sstephenson/execjs#readme for more supported runtimes
  # gem 'therubyracer', :platforms => :ruby

  gem 'uglifier', '>= 1.0.3'
end

gem 'jquery-rails'
gem 'bootstrap-sass'
gem "jquery-fileupload-rails", "~> 0.3.5"


# Gems used in only by test and development
group :test, :development do
  gem 'rspec-rails', '~> 2.11'
  gem 'factory_girl_rails'
end

# Gems used only for tests and not required
# in production environments by default.
group :test do
  # gem 'cucumber', '1.1.3'  # Naoufal: Not necessary anymore as tests use exclusively RSpec
  gem 'rspec-expectations', '~> 2.11'
  gem 'capybara', '1.1.2'
  gem 'database_cleaner'
  # gem 'cucumber-rails' # Naoufal: Not necessary anymore as tests use exclusively RSpec
  gem 'guard-rspec'
  gem 'launchy'
end
gem 'devise', '~>1.4.3'

# Orkun: These gems are required to upload and view pictures belonging to Article model

gem "paperclip", :git => "git://github.com/thoughtbot/paperclip.git"
gem "nifty-generators"
gem "fog"
# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# To use Jbuilder templates for JSON
# gem 'jbuilder'

# Use unicorn as the app server
# gem 'unicorn'

# Deploy with Capistrano
# gem 'capistrano'

# To use debugger
# gem 'debugger'


# Naoufal: These gems are required to enable proper HTML text truncation
gem "nokogiri"
gem "html_truncator", "~>0.2"


#           To use advanced nested forms
gem "nested_form"
# To use JQuery file uploader gem provided by: https://github.com/tors/jquery-fileupload-rails


