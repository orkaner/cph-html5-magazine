class MagazinesController < ApplicationController


  # TODO: Change the following line to load the layout dynamically
  #       depending on the template associated to the magazine
  #layout "ts_test"#:chosenGrid
  layout "ts_test", :only => [:toc, :cover]

  # GET /magazines
  # GET /magazines.json
  def index
    @magazines = Magazine.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @magazines }
    end
  end
  

  # GET /magazines/1
  # GET /magazines/1.json
  def show
    @magazine = Magazine.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @magazine }
    end
  end

  # GET /magazines/new
  # GET /magazines/new.json
  def new
    @magazine = Magazine.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @magazine }
    end
  end

  # GET /magazines/1/edit
  def edit
    @magazine = Magazine.find(params[:id])
  end

  # POST /magazines
  # POST /magazines.json
  def create
    @magazine = Magazine.new(params[:magazine])

    respond_to do |format|
      if @magazine.save
        format.html { redirect_to @magazine, notice: 'Magazine was successfully created.' }
        format.json { render json: @magazine, status: :created, location: @magazine }
      else
        format.html { render action: "new" }
        format.json { render json: @magazine.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /magazines/1
  # PUT /magazines/1.json
  def update
    @magazine = Magazine.find(params[:id])

    respond_to do |format|
      if @magazine.update_attributes(params[:magazine])
        format.html { redirect_to @magazine, notice: 'Magazine was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @magazine.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /magazines/1
  # DELETE /magazines/1.json
  def destroy
    @magazine = Magazine.find(params[:id])
    @magazine.destroy

    respond_to do |format|
      format.html { redirect_to magazines_url }
      format.json { head :no_content }
    end
  end

  # Naoufal: Allow reading the selected magazine
  #   Edit: Reading a magazine is not done through this method.
  def read
    @magazine = Magazine.find(params[:id])
    #gridToUse = "ts_test"
  end

  # Naoufal: Returns the first article in the magazine
  def firstArticle
    @magazine = Magazine.find(params[:id])
    @article = @magazine.articles.first
  end
  # Naoufal: Create the magazine's Table Of Content (TOC)
  def toc
    @magazine = Magazine.find(params[:id])
  end

  # Naoufal: Create the magazine's Cover
  def cover
    @magazine = Magazine.find(params[:id])
  end

  # Naoufal: Create the content index of the magazine as JSON file.
  #   Note: This is required in treesaver version 0.10.x
  def content_index
    @magazine = Magazine.find(params[:id])
    # Initiate the array of contents' links
    a = []

    # Insert the link to the cover first
    a << {"url" => cover_magazine_url, "title" => "Cover", "hidden" => true}


    # Insert the link to the toc
    a << {"url" => toc_magazine_url, "title" => "TOC", "hidden" => true}

    # Insert the links to all the magazine's articles
    @magazine.articles.each do |article|
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


