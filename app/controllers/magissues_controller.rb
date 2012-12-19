class MagissuesController < ApplicationController


  # TODO: Change the following line to load the layout dynamically
  #       depending on the template associated to the magazine issue
  #layout "ts_test"#:chosenGrid
  layout "ts_test", :only => [:toc, :cover]

  # GET /magissues
  # GET /magissues.json
  def index
    @magissues = Magissue.all
    @magazines = Magazine.all
    
    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @magissues }
    end
  end
  

  # GET /magissues/1
  # GET /magissues/1.json
  def show
    @magissue = Magissue.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb 
      format.json { render json: @magissue }
    end
  end

  # GET /magissues/new
  # GET /magissues/new.json
  def new
    @magissue = Magissue.new(params[:new_issue])
        
    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @magissue }
    end
  end

  # GET /magissues/1/edit
  def edit
    @magissue = Magissue.find(params[:id])
  end

  # POST /Magissues
  # POST /Magissues.json
  def create
    @magissue = Magissue.new(params[:magissue])

    respond_to do |format|
      if @magissue.save
        format.html { redirect_to @magissue, notice: 'Magazine issue was successfully created.' }
        format.json { render json: @magissue, status: :created, location: @magissue }
      else
        format.html { render action: "new" }
        format.json { render json: @magissue.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /magissues/1
  # PUT /magissues/1.json
  def update
    @magissue = Magissue.find(params[:id])

    respond_to do |format|
      if @magissue.update_attributes(params[:magissue])
        format.html { redirect_to @magissue, notice: 'Magazine issue was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @magissue.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /magissues/1
  # DELETE /magissues/1.json
  def destroy
    @magissue = Magissue.find(params[:id])
    @magissue.destroy

    respond_to do |format|
      format.html { redirect_to magissues_url }
      format.json { head :no_content }
    end
  end

  # Naoufal: Allow reading the selected magazine issue
  #   Edit: Reading a magazine issue is not done through this method.
  def read
    @magissue = Magissue.find(params[:id])
    #gridToUse = "ts_test"
  end

  # Naoufal: Returns the first article in the magazine issue
  def firstArticle
    @magissue = Magissue.find(params[:id])
    @article = @magissue.articles.first
  end
  # Naoufal: Create the magissues's Table Of Content (TOC)
  def toc
    @magissue = Magissue.find(params[:id])
  end

  # Naoufal: Create the magissues's Cover
  def cover
    @magissue = Magissue.find(params[:id])
  end

  # Naoufal: Create the content index of the magissues as JSON file.
  #   Note: This is required in treesaver version 0.10.x
  def content_index
    @magissue = Magissue.find(params[:id])
    # Initiate the array of contents' links
    a = []

    # Insert the link to the cover first
    a << {"url" => cover_magissue_url, "title" => "Cover", "hidden" => true}


    # Insert the link to the toc
    a << {"url" => toc_magissue_url, "title" => "TOC", "hidden" => true}

    # Insert the links to all the magissues's articles
    @magissue.articles.each do |article|
      entry = {"url" => read_article_url(article), "title" => article.headline, "byline" => article.author,
               "thumb" => (article.assets.exists? ? article.assets[0].dynamic_asset_url("40x40>") : "")}
      a << entry
    end

    # Create the "contents" object and and associate the links array to it.
    b = {"contents" => a}

    # Render the response as JSON
    respond_to do |format|
      format.json { render :json => b }
    end
  end

end


