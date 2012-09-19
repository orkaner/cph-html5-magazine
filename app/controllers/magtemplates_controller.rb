class MagtemplatesController < ApplicationController
  # GET /magtemplates
  # GET /magtemplates.json
  def index
    @magtemplates = Magtemplate.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @magtemplates }
    end
  end

  # GET /magtemplates/1
  # GET /magtemplates/1.json
  def show
    @magtemplate = Magtemplate.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @magtemplate }
    end
  end

  # GET /magtemplates/new
  # GET /magtemplates/new.json
  def new
    @magtemplate = Magtemplate.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @magtemplate }
    end
  end

  # GET /magtemplates/1/edit
  def edit
    @magtemplate = Magtemplate.find(params[:id])
  end

  # POST /magtemplates
  # POST /magtemplates.json
  def create
    @magtemplate = Magtemplate.new(params[:magtemplate])

    respond_to do |format|
      if @magtemplate.save
        format.html { redirect_to @magtemplate, notice: 'Magtemplate was successfully created.' }
        format.json { render json: @magtemplate, status: :created, location: @magtemplate }
      else
        format.html { render action: "new" }
        format.json { render json: @magtemplate.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /magtemplates/1
  # PUT /magtemplates/1.json
  def update
    @magtemplate = Magtemplate.find(params[:id])

    respond_to do |format|
      if @magtemplate.update_attributes(params[:magtemplate])
        format.html { redirect_to @magtemplate, notice: 'Magtemplate was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @magtemplate.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /magtemplates/1
  # DELETE /magtemplates/1.json
  def destroy
    @magtemplate = Magtemplate.find(params[:id])
    @magtemplate.destroy

    respond_to do |format|
      format.html { redirect_to magtemplates_url }
      format.json { head :no_content }
    end
  end
end
