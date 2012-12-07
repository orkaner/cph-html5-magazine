class WelcomeController < ApplicationController

layout 'appwelcome'
  
  def index
    @magazines = Magazine.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @magazines }
    end
  end
  

  # GET /magissues/1
  # GET /magissues/1.json
  def show
    @magazine = Magazine.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @magazine }
    end
  end
  
end
