class VideolinksController < ApplicationController
  # GET /videolinks
  # GET /videolinks.json
  def index
    @videolinks = Videolink.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @videolinks }
    end
  end

  # GET /videolinks/1
  # GET /videolinks/1.json
  def show
    @videolink = Videolink.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @videolink }
    end
  end

  # GET /videolinks/new
  # GET /videolinks/new.json
  def new
    @videolink = Videolink.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @videolink }
    end
  end

  # GET /videolinks/1/edit
  def edit
    @videolink = Videolink.find(params[:id])
  end

  # POST /videolinks
  # POST /videolinks.json
  def create
    @videolink = Videolink.new(params[:videolink])

    respond_to do |format|
      if @videolink.save
        format.html { redirect_to @videolink, notice: 'Videolink was successfully created.' }
        format.json { render json: @videolink, status: :created, location: @videolink }
      else
        format.html { render action: "new" }
        format.json { render json: @videolink.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /videolinks/1
  # PUT /videolinks/1.json
  def update
    @videolink = Videolink.find(params[:id])

    respond_to do |format|
      if @videolink.update_attributes(params[:videolink])
        format.html { redirect_to @videolink, notice: 'Videolink was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @videolink.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /videolinks/1
  # DELETE /videolinks/1.json
  def destroy
    @videolink = Videolink.find(params[:id])
    @videolink.destroy

    respond_to do |format|
      format.html { redirect_to videolinks_url }
      format.json { head :no_content }
    end
  end
end
